// src/services/agendamentoService.js - VERSÃO CORRIGIDA COMPLETA

import { pool } from "../database/index.js";
import ApiError from "../utils/apiError.js";

// Configurações de horários (substitua por suas configurações reais)
const SCHEDULE = {
    OPEN: "08:00",
    CLOSE: "18:00",
    SLOT_MINUTES: 50,
    MAX_CONCURRENT: 3,
    TZ: "America/Sao_Paulo"
};

// Função auxiliar para gerar slots do dia
function buildSlotsOfDay() {
    const slots = [];
    const [openHour, openMin] = SCHEDULE.OPEN.split(':').map(Number);
    const [closeHour, closeMin] = SCHEDULE.CLOSE.split(':').map(Number);

    let currentTime = openHour * 60 + openMin;
    const endTime = closeHour * 60 + closeMin;

    while (currentTime < endTime) {
        const hour = Math.floor(currentTime / 60);
        const min = currentTime % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(timeStr);
        currentTime += SCHEDULE.SLOT_MINUTES;
    }

    return slots;
}

// Função que estava faltando
function parseStatusFilter(status) {
    if (!status) return null;
    const arr = Array.isArray(status) ? status : String(status).split(",").map(s => s.trim());
    return arr.filter(Boolean);
}

// Funções auxiliares
export function isPastDateTime(data, horario) {
    const agendamento = new Date(`${data}T${horario}:00`);
    const agora = new Date();
    return agendamento < agora;
}

export function sanitizePlate(placa) {
    if (!placa) return "";
    return String(placa).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function canTransition(currentStatus, newStatus) {
    const transitions = {
        'agendado': ['em_andamento', 'cancelado'],
        'em_andamento': ['concluido', 'cancelado'],
        'concluido': [],
        'cancelado': [],
        'reagendado': []
    };
    return transitions[currentStatus]?.includes(newStatus) || false;
}

function isTerminalStatus(status) {
    return ['concluido', 'cancelado'].includes(status);
}

// Regras auxiliares
async function countAtSlot({ data, horario }) {
    const q = `
        SELECT COUNT(*)::int AS total
        FROM agendamentos
        WHERE data = $1
          AND horario = $2::time
          AND status IN ('agendado','em_andamento')
    `;
    const { rows } = await pool.query(q, [data, horario]);
    return rows[0]?.total || 0;
}

async function findById(id) {
    const { rows } = await pool.query(`SELECT * FROM agendamentos WHERE id = $1`, [id]);
    return rows[0] || null;
}

function assertOwnershipOrAdmin(ag, user) {
    if (!ag) throw new ApiError(404, "Agendamento não encontrado");
    if (user.role !== "admin" && ag.usuario_id !== user.id) {
        throw new ApiError(403, "Você não tem permissão para acessar este agendamento");
    }
}

// API pública
export async function getDailySlots({ data }) {
    // CORRIGIDO: incluir servico_id na busca
    const { rows } = await pool.query(
        `SELECT horario::text, COUNT(*) FILTER (WHERE status IN ('agendado','em_andamento'))::int AS ocupados
         FROM agendamentos
         WHERE data = $1 AND servico_id IS NOT NULL
         GROUP BY horario
         ORDER BY horario`,
        [data]
    );

    // DEBUG: Adicione este log
    console.log("🔍 Slots ocupados para", data, ":", rows);

    const ocupacao = new Map(rows.map(r => [r.horario.slice(0, 5), r.ocupados]));
    const slots = buildSlotsOfDay().map(h => {
        const used = ocupacao.get(h) || 0;
        return {
            horario: h,
            ocupados: used,
            capacidade: SCHEDULE.MAX_CONCURRENT,
            disponivel: Math.max(SCHEDULE.MAX_CONCURRENT - used, 0)
        };
    });

    return { data, slots };
}
export async function list({ status, data_ini, data_fim, usuario_id, page = 1, page_size = 20, isAdmin = false }) {
    const where = [];
    const params = [];
    let i = 1;

    if (usuario_id) {
        where.push(`a.usuario_id = $${i++}`);
        params.push(usuario_id);
    }
    if (data_ini) {
        where.push(`a.data >= $${i++}`);
        params.push(data_ini);
    }
    if (data_fim) {
        where.push(`a.data <= $${i++}`);
        params.push(data_fim);
    }

    const statusArr = parseStatusFilter(status);
    if (statusArr?.length) {
        where.push(`a.status = ANY($${i++})`);
        params.push(statusArr);
    }

    const whereSQL = where.length ? ` WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * page_size;

    // Query diferente para admin - inclui dados do cliente
    const baseQuery = isAdmin
        ? `
        SELECT 
            a.*,
            u.nome as usuario_nome,
            u.email as usuario_email,
            s.nome as servico_nome,
            s.valor as servico_valor
        FROM agendamentos a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        LEFT JOIN servicos s ON a.servico_id = s.id
        ${whereSQL}
        ORDER BY a.data DESC, a.horario DESC
        LIMIT $${i++} OFFSET $${i++}
        `
        : `
        SELECT 
            a.*,
            s.nome as servico_nome,
            s.valor as servico_valor
        FROM agendamentos a
        LEFT JOIN servicos s ON a.servico_id = s.id
        ${whereSQL}
        ORDER BY a.data DESC, a.horario DESC
        LIMIT $${i++} OFFSET $${i++}
        `;

    params.push(page_size, offset);

    const countQuery = `
        SELECT COUNT(*)::int AS count
        FROM agendamentos a
        ${whereSQL}
    `;

    try {
        const [dataRes, countRes] = await Promise.all([
            pool.query(baseQuery, params),
            pool.query(countQuery, params.slice(0, -2))
        ]);

        const total = countRes.rows[0]?.count || 0;

        console.log("🔍 Dados retornados da query:", dataRes.rows[0]);

        return {
            data: dataRes.rows,
            page,
            page_size,
            total,
            total_pages: Math.ceil(total / page_size),
            has_next: page < Math.ceil(total / page_size),
            has_prev: page > 1
        };
    } catch (error) {
        console.error("Erro na query de agendamentos:", error);
        throw new ApiError(500, "Erro ao buscar agendamentos", error);
    }
}

export async function getById(id, user) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);
    return ag;
}

export async function getByIdWithClientInfo(id, user) {
    const isAdmin = user.role === "admin";

    const query = isAdmin
        ? `
        SELECT 
            a.*,
            u.nome as usuario_nome,
            u.email as usuario_email,
            s.nome as servico_nome,
            s.valor as servico_valor
        FROM agendamentos a
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        LEFT JOIN servicos s ON a.servico_id = s.id
        WHERE a.id = $1
        `
        : `
        SELECT 
            a.*,
            s.nome as servico_nome,
            s.valor as servico_valor
        FROM agendamentos a
        LEFT JOIN servicos s ON a.servico_id = s.id
        WHERE a.id = $1 AND a.usuario_id = $2
        `;

    const params = isAdmin ? [id] : [id, user.id];
    const { rows } = await pool.query(query, params);

    if (!rows[0]) return null;

    return rows[0];
}

export async function create(payload) {
    const {
        usuario_id,
        modelo_veiculo,
        cor,
        placa,
        servico_id, // CORRIGIDO: usar servico_id
        data,
        horario,
        observacoes = null
    } = payload;

    const plate = sanitizePlate(placa);

    if (isPastDateTime(data, horario)) {
        throw new ApiError(400, "Não é possível agendar no passado");
    }

    const validSlot = buildSlotsOfDay().includes(horario);
    if (!validSlot) throw new ApiError(400, "Horário fora do expediente ou inválido para o slot configurado");

    const used = await countAtSlot({ data, horario });
    if (used >= SCHEDULE.MAX_CONCURRENT) {
        throw new ApiError(409, "Horário esgotado");
    }

    // Verificar se o serviço existe
    const { rows: servicoRows } = await pool.query(
        'SELECT id, nome, valor FROM servicos WHERE id = $1 AND ativo = true',
        [servico_id]
    );

    if (!servicoRows[0]) {
        throw new ApiError(400, "Serviço não encontrado ou inativo");
    }

    const dupQ = `
        SELECT 1 FROM agendamentos
        WHERE usuario_id = $1 AND data = $2 AND horario = $3::time
          AND status IN ('agendado','em_andamento')
        LIMIT 1
    `;
    const { rowCount: dup } = await pool.query(dupQ, [usuario_id, data, horario]);
    if (dup) throw new ApiError(409, "Você já possui um agendamento ativo neste horário");

    const plateCheckQ = `
        SELECT 1 FROM agendamentos
        WHERE placa = $1 AND data = $2
          AND status IN ('agendado','em_andamento')
        LIMIT 1
    `;
    const { rowCount: plateExists } = await pool.query(plateCheckQ, [plate, data]);
    if (plateExists) throw new ApiError(409, "Esta placa já possui um agendamento ativo neste dia");

    // CORRIGIDO: usar servico_id na query
    const insert = `
        INSERT INTO agendamentos (usuario_id, modelo_veiculo, cor, placa, servico_id, data, horario, observacoes, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'agendado')
        RETURNING *
    `;

    const { rows } = await pool.query(insert, [
        usuario_id, modelo_veiculo, cor, plate, servico_id, data, horario, observacoes
    ]);

    // Retornar com dados do serviço
    return {
        ...rows[0],
        servico_nome: servicoRows[0].nome,
        servico_valor: servicoRows[0].valor,
    };
}

export async function reschedule(id, user, { data, horario }) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);

    if (isTerminalStatus(ag.status)) {
        throw new ApiError(400, "Agendamentos finalizados ou cancelados não podem ser reagendados");
    }
    if (ag.status !== "agendado") {
        throw new ApiError(400, "Só é possível reagendar quando o status é 'agendado'");
    }
    if (isPastDateTime(data, horario)) {
        throw new ApiError(400, "Não é possível reagendar para o passado");
    }

    const validSlot = buildSlotsOfDay().includes(horario);
    if (!validSlot) throw new ApiError(400, "Horário fora do expediente ou inválido para o slot configurado");

    const used = await countAtSlot({ data, horario });
    if (used >= SCHEDULE.MAX_CONCURRENT) {
        throw new ApiError(409, "Horário esgotado");
    }

    const upd = `
        UPDATE agendamentos
        SET data = $1, horario = $2::time, updated_at = now()
        WHERE id = $3
        RETURNING *
    `;
    const { rows } = await pool.query(upd, [data, horario, id]);
    return rows[0];
}

export async function updateStatus(id, user, newStatus) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);

    if (!canTransition(ag.status, newStatus)) {
        throw new ApiError(400, `Transição de '${ag.status}' para '${newStatus}' não permitida`);
    }

    const upd = `
        UPDATE agendamentos
        SET status = $1, updated_at = now()
        WHERE id = $2
        RETURNING *
    `;
    const { rows } = await pool.query(upd, [newStatus, id]);
    return rows[0];
}

export async function updateAgendamento(id, user, payload) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);

    if (ag.status !== "agendado") {
        throw new ApiError(400, "Só é possível editar agendamentos com status 'agendado'");
    }

    const {
        modelo_veiculo,
        cor,
        placa,
        servico_id, // CORRIGIDO: usar servico_id
        data,
        horario,
        observacoes
    } = payload;

    if (!modelo_veiculo || !placa || !servico_id || !data || !horario) {
        throw new ApiError(400, "Campos obrigatórios: modelo_veiculo, placa, servico_id, data, horario");
    }

    const plate = sanitizePlate(placa);

    if (isPastDateTime(data, horario)) {
        throw new ApiError(400, "Não é possível agendar no passado");
    }

    const validSlot = buildSlotsOfDay().includes(horario);
    if (!validSlot) {
        throw new ApiError(400, "Horário fora do expediente ou inválido para o slot configurado");
    }

    // Verificar se o serviço existe
    const { rows: servicoRows } = await pool.query(
        'SELECT id FROM servicos WHERE id = $1 AND ativo = true',
        [servico_id]
    );

    if (!servicoRows[0]) {
        throw new ApiError(400, "Serviço não encontrado ou inativo");
    }

    const changedDateTime = ag.data !== data || ag.horario !== horario;
    if (changedDateTime) {
        const used = await countAtSlot({ data, horario });
        if (used >= SCHEDULE.MAX_CONCURRENT) {
            throw new ApiError(409, "Horário esgotado");
        }

        const dupQ = `
            SELECT 1 FROM agendamentos
            WHERE usuario_id = $1 AND data = $2 AND horario = $3::time
              AND status IN ('agendado','em_andamento')
              AND id != $4
            LIMIT 1
        `;
        const { rowCount: dup } = await pool.query(dupQ, [ag.usuario_id, data, horario, id]);
        if (dup) {
            throw new ApiError(409, "Você já possui um agendamento neste horário");
        }
    }

    // CORRIGIDO: usar servico_id na query
    const updateQuery = `
        UPDATE agendamentos
        SET 
            modelo_veiculo = $1,
            cor = $2,
            placa = $3,
            servico_id = $4,
            data = $5,
            horario = $6::time,
            observacoes = $7,
            updated_at = now()
        WHERE id = $8
        RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, [
        modelo_veiculo,
        cor || null,
        plate,
        servico_id, // CORRIGIDO
        data,
        horario,
        observacoes || null,
        id
    ]);

    return await getByIdWithClientInfo(rows[0].id, user);
}