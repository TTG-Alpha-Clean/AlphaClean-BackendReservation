// src/utils/validators.js - ATUALIZADO PARA SERVICO_ID
import ApiError from "./apiError.js";

// formatos básicos; DB já tem checks, isso aqui é para erro amigável
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;     // YYYY-MM-DD
const TIME_RX = /^\d{2}:\d{2}$/;           // HH:mm
const PLATE_RX_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/; // ABC1D23 (Mercosul)
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertCreatePayload(body) {
    // ✅ Agora usa servico_id em vez de servico
    const required = ["modelo_veiculo", "placa", "servico_id", "data", "horario"];
    for (const k of required) {
        if (!body[k]) throw new ApiError(400, `Campo obrigatório: ${k}`);
    }

    if (!DATE_RX.test(body.data)) throw new ApiError(400, "data deve ser YYYY-MM-DD");
    if (!TIME_RX.test(body.horario)) throw new ApiError(400, "horario deve ser HH:mm");
    if (!PLATE_RX_MERCOSUL.test(String(body.placa).toUpperCase())) {
        throw new ApiError(400, "placa inválida (formato Mercosul: ABC1D23)");
    }
    if (!UUID_RX.test(body.servico_id)) {
        throw new ApiError(400, "servico_id deve ser um UUID válido");
    }

    return {
        usuario_id: body.usuario_id, // será sobrescrito pelo controller
        modelo_veiculo: String(body.modelo_veiculo),
        cor: body.cor ? String(body.cor) : null,
        placa: String(body.placa).toUpperCase(),
        servico_id: String(body.servico_id), // ✅ UUID do serviço
        data: body.data,
        horario: body.horario,
        observacoes: body.observacoes ? String(body.observacoes) : null,
    };
}

// ✅ NOVA: Validação para edição completa
export function assertUpdatePayload(body) {
    const required = ["modelo_veiculo", "placa", "servico_id", "data", "horario"];
    for (const k of required) {
        if (!body[k]) throw new ApiError(400, `Campo obrigatório: ${k}`);
    }
    if (!DATE_RX.test(body.data)) throw new ApiError(400, "data deve ser YYYY-MM-DD");
    if (!TIME_RX.test(body.horario)) throw new ApiError(400, "horario deve ser HH:mm");
    if (!PLATE_RX_MERCOSUL.test(String(body.placa).toUpperCase())) {
        throw new ApiError(400, "placa inválida (formato Mercosul: ABC1D23)");
    }
    if (!UUID_RX.test(body.servico_id)) {
        throw new ApiError(400, "servico_id deve ser um UUID válido");
    }

    return {
        modelo_veiculo: String(body.modelo_veiculo),
        cor: body.cor ? String(body.cor) : null,
        placa: String(body.placa).toUpperCase(),
        servico_id: String(body.servico_id), // ✅ UUID do serviço
        data: body.data,
        horario: body.horario,
        observacoes: body.observacoes ? String(body.observacoes) : null,
    };
}

export function assertReschedulePayload(body) {
    if (!body?.data || !DATE_RX.test(body.data)) throw new ApiError(400, "data (YYYY-MM-DD) é obrigatória");
    if (!body?.horario || !TIME_RX.test(body.horario)) throw new ApiError(400, "horario (HH:mm) é obrigatório");
    return { data: body.data, horario: body.horario };
}

export function assertStatusPayload(body) {
    const allowed = ["agendado", "em_andamento", "finalizado", "cancelado", "reagendado"]; // ✅ Mudou "concluido" para "finalizado"
    if (!body?.status || !allowed.includes(body.status)) {
        throw new ApiError(400, `status inválido. Valores permitidos: ${allowed.join(", ")}`);
    }
    return { status: body.status };
}

// Adicione estas funções no final do arquivo validators.js

export function isPastDateTime(data, horario) {
    const agendamento = new Date(`${data}T${horario}:00`);
    const agora = new Date();
    return agendamento < agora;
}

export function sanitizePlate(placa) {
    if (!placa) return "";
    // Remove espaços e caracteres especiais, converte para maiúsculo
    const clean = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Aplica formato Mercosul se tiver 7 caracteres
    if (clean.length === 7) {
        return clean.slice(0, 3) + clean.slice(3, 4) + clean.slice(4, 5) + clean.slice(5, 7);
    }

    return clean;
}