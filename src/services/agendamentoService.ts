// src/services/agendamentoService.ts - VERSÃO TYPESCRIPT
import { pool } from "../database/index";
import ApiError from "../utils/apiError";
import { AuthenticatedRequest, Agendamento, TimeSlot, DailySlotsResponse } from "../types/interfaces";

// Configurações de horários
const SCHEDULE = {
    OPEN: "08:00",
    CLOSE: "18:00",
    SLOT_MINUTES: 50,
    MAX_CONCURRENT: 3,
    TZ: "America/Sao_Paulo"
};

// Interface para filtros de listagem
interface ListFilters {
    status?: string;
    data_ini?: string;
    data_fim?: string;
    usuario_id?: string | null;
    page?: number;
    page_size?: number;
    isAdmin?: boolean;
}

// Interface para criação de agendamento
interface CreateAgendamentoPayload {
    usuario_id: string;
    modelo_veiculo: string;
    cor?: string | null;
    placa: string;
    servico_id: string;
    data: string;
    horario: string;
    observacoes?: string | null;
}

// Interface para atualização de agendamento
interface UpdateAgendamentoPayload {
    modelo_veiculo: string;
    cor?: string | null;
    placa: string;
    servico_id: string;
    data: string;
    horario: string;
    observacoes?: string | null;
}

// Interface para reagendamento
interface ReschedulePayload {
    data: string;
    horario: string;
}

// Interface para usuário autenticado (simplificada)
interface AuthUser {
    id: string;
    role: 'user' | 'admin';
}

// Função auxiliar para gerar slots do dia
function buildSlotsOfDay(): string[] {
    const slots: string[] = [];
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

function parseStatusFilter(status?: string): string[] | null {
    if (!status) return null;
    const arr = Array.isArray(status) ? status : String(status).split(",").map(s => s.trim());
    return arr.filter(Boolean);
}

// Funções auxiliares
export function isPastDateTime(data: string, horario: string): boolean {
    const agendamento = new Date(`${data}T${horario}:00`);
    const agora = new Date();
    return agendamento < agora;
}

export function sanitizePlate(placa: string): string {
    if (!placa) return "";
    return String(placa).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Lógica de transições simplificada
function canTransition(currentStatus: string, newStatus: string, userRole: string): boolean {
    // Para clientes - podem cancelar agendamentos
    if (userRole !== "admin") {
        return currentStatus === "agendado" && newStatus === "cancelado";
    }

    // Para admins - controle total
    const transitions: Record<string, string[]> = {
        'agendado': ['cancelado', 'finalizado'],
        'cancelado': [], // Status final
        'finalizado': [] // Status final
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
}

// Regras auxiliares
async function countAtSlot({ data, horario }: { data: string; horario: string }): Promise<number> {
    const q = `
        SELECT COUNT(*)::int AS total
        FROM agendamentos
        WHERE data = $1
          AND horario = $2::time
          AND status IN ('agendado','finalizado')
    `;
    const { rows } = await pool.query(q, [data, horario]);
    return rows[0]?.total || 0;
}

async function findById(id: string): Promise<any> {
    const { rows } = await pool.query(`SELECT * FROM agendamentos WHERE id = $1`, [id]);
    return rows[0] || null;
}

function assertOwnershipOrAdmin(ag: any, user: AuthUser): void {
    if (!ag) throw new ApiError(404, "Agendamento não encontrado");
    if (user.role !== "admin" && ag.usuario_id !== user.id) {
        throw new ApiError(403, "Você não tem permissão para acessar este agendamento");
    }
}

// ===== API PÚBLICA =====

export async function getDailySlots({ data }: { data: string }): Promise<DailySlotsResponse> {
    const { rows } = await pool.query(
        `SELECT horario::text, COUNT(*) FILTER (WHERE status IN ('agendado','finalizado'))::int AS ocupados
         FROM agendamentos
         WHERE data = $1 AND servico_id IS NOT NULL
         GROUP BY horario
         ORDER BY horario`,
        [data]
    );

    const ocupacao = new Map(rows.map(r => [r.horario.slice(0, 5), r.ocupados]));
    const slots: TimeSlot[] = buildSlotsOfDay().map(h => {
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

export async function list(filters: ListFilters) {
    const {
        status,
        data_ini,
        data_fim,
        usuario_id,
        page = 1,
        page_size = 20,
        isAdmin = false
    } = filters;

    const where: string[] = [];
    const params: any[] = [];
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
        SELECT COUNT(*)::int AS total
        FROM agendamentos a
        ${whereSQL}
    `;
    const countParams = params.slice(0, -2); // Remove LIMIT e OFFSET

    const [dataResult, countResult] = await Promise.all([
        pool.query(baseQuery, params),
        pool.query(countQuery, countParams)
    ]);

    const totalItems = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / page_size);

    return {
        data: dataResult.rows,
        pagination: {
            page,
            page_size,
            total_items: totalItems,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        }
    };
}

export async function getByIdWithClientInfo(id: string, user: AuthUser): Promise<any> {
    const isAdmin = user?.role === "admin";

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

    return rows[0] || null;
}

export async function deleteAgendamento(id: string, user: AuthUser) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);

    // Verificar se o agendamento pode ser excluído
    const canDelete = user.role === "admin"
        ? ['cancelado', 'finalizado'].includes(ag.status)  // Admin pode excluir cancelados e finalizados
        : ag.status === 'cancelado';                       // Cliente só pode excluir cancelados

    if (!canDelete) {
        const allowedStatuses = user.role === "admin"
            ? "cancelados ou finalizados"
            : "cancelados";
        throw new ApiError(400, `Só é possível excluir agendamentos ${allowedStatuses}`);
    }

    // Excluir o agendamento do banco de dados
    const deleteQuery = `
        DELETE FROM agendamentos 
        WHERE id = $1 
        RETURNING id, status, modelo_veiculo, data, horario
    `;

    const { rows } = await pool.query(deleteQuery, [id]);

    if (!rows[0]) {
        throw new ApiError(404, "Agendamento não encontrado");
    }

    return {
        deleted: true,
        agendamento: rows[0],
        message: "Agendamento excluído com sucesso"
    };
}

export async function create(payload: CreateAgendamentoPayload) {
    const {
        usuario_id,
        modelo_veiculo,
        cor,
        placa,
        servico_id,
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
          AND status IN ('agendado','finalizado')
        LIMIT 1
    `;
    const { rowCount: dup } = await pool.query(dupQ, [usuario_id, data, horario]);
    if (dup) throw new ApiError(409, "Você já possui um agendamento ativo neste horário");

    const plateCheckQ = `
        SELECT 1 FROM agendamentos
        WHERE placa = $1 AND data = $2
          AND status IN ('agendado','finalizado')
        LIMIT 1
    `;
    const { rowCount: plateExists } = await pool.query(plateCheckQ, [plate, data]);
    if (plateExists) throw new ApiError(409, "Esta placa já possui agendamento neste dia");

    const ins = `
        INSERT INTO agendamentos (
            usuario_id, modelo_veiculo, cor, placa,
            servico_id, data, horario, observacoes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'agendado')
        RETURNING *
    `;

    const { rows } = await pool.query(ins, [
        usuario_id, modelo_veiculo, cor, plate,
        servico_id, data, horario, observacoes
    ]);

    return rows[0];
}

export async function reschedule(id: string, user: AuthUser, { data, horario }: ReschedulePayload) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);

    if (ag.status !== "agendado") {
        throw new ApiError(400, "Só é possível reagendar agendamentos com status 'agendado'");
    }

    if (isPastDateTime(data, horario)) {
        throw new ApiError(400, "Não é possível reagendar para o passado");
    }

    const validSlot = buildSlotsOfDay().includes(horario);
    if (!validSlot) throw new ApiError(400, "Horário fora do expediente");

    // Verificar disponibilidade (excluindo o próprio agendamento)
    const conflictQ = `
        SELECT COUNT(*)::int AS total FROM agendamentos
        WHERE data = $1 AND horario = $2::time AND id != $3
          AND status IN ('agendado','finalizado')
    `;
    const { rows: conflictRows } = await pool.query(conflictQ, [data, horario, id]);
    const conflicts = conflictRows[0]?.total || 0;

    if (conflicts >= SCHEDULE.MAX_CONCURRENT) {
        throw new ApiError(409, "Horário não disponível");
    }

    const upd = `
        UPDATE agendamentos
        SET data = $1, horario = $2, updated_at = now()
        WHERE id = $3
        RETURNING *
    `;
    const { rows } = await pool.query(upd, [data, horario, id]);
    return rows[0];
}

export async function updateStatus(id: string, user: AuthUser, newStatus: string) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);

    if (!canTransition(ag.status, newStatus, user.role)) {
        const transitions = user.role === "admin"
            ? "admins podem cancelar ou finalizar agendamentos"
            : "clientes só podem cancelar agendamentos próprios";
        throw new ApiError(400, `Transição de '${ag.status}' para '${newStatus}' não permitida. ${transitions}.`);
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

export async function updateAgendamento(id: string, user: AuthUser, payload: UpdateAgendamentoPayload) {
    const ag = await findById(id);
    assertOwnershipOrAdmin(ag, user);

    if (ag.status !== "agendado") {
        throw new ApiError(400, "Só é possível editar agendamentos com status 'agendado'");
    }

    const {
        modelo_veiculo,
        cor,
        placa,
        servico_id,
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

    // Verificar disponibilidade (excluindo o próprio agendamento)
    const conflictQ = `
        SELECT COUNT(*)::int AS total FROM agendamentos
        WHERE data = $1 AND horario = $2::time AND id != $3
          AND status IN ('agendado','finalizado')
    `;
    const { rows: conflictRows } = await pool.query(conflictQ, [data, horario, id]);
    const conflicts = conflictRows[0]?.total || 0;

    if (conflicts >= SCHEDULE.MAX_CONCURRENT) {
        throw new ApiError(409, "Horário não disponível");
    }

    const upd = `
        UPDATE agendamentos
        SET modelo_veiculo = $1, cor = $2, placa = $3, servico_id = $4,
            data = $5, horario = $6, observacoes = $7, updated_at = now()
        WHERE id = $8
        RETURNING *
    `;

    const { rows } = await pool.query(upd, [
        modelo_veiculo, cor, plate, servico_id,
        data, horario, observacoes, id
    ]);

    return rows[0];
}