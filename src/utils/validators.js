import ApiError from "./ApiError.js";

// formatos básicos; DB já tem checks, isso aqui é para erro amigável
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;     // YYYY-MM-DD
const TIME_RX = /^\d{2}:\d{2}$/;           // HH:mm
const PLATE_RX = /^[A-Z]{3}-\d{4}$/;

export function assertCreatePayload(body) {
    const required = ["modelo_veiculo", "placa", "servico", "data", "horario"];
    for (const k of required) {
        if (!body[k]) throw new ApiError(400, `Campo obrigatório: ${k}`);
    }
    if (!DATE_RX.test(body.data)) throw new ApiError(400, "data deve ser YYYY-MM-DD");
    if (!TIME_RX.test(body.horario)) throw new ApiError(400, "horario deve ser HH:mm");
    if (!PLATE_RX.test(String(body.placa).toUpperCase())) throw new ApiError(400, "placa inválida (AAA-1234)");
    return {
        usuario_id: body.usuario_id, // será sobrescrito pelo controller
        modelo_veiculo: String(body.modelo_veiculo),
        cor: body.cor ? String(body.cor) : null,
        placa: String(body.placa).toUpperCase(),
        servico: String(body.servico),
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
    const allowed = ["agendado", "em_andamento", "finalizado", "cancelado"];
    if (!body?.status || !allowed.includes(body.status)) {
        throw new ApiError(400, `status inválido. Use: ${allowed.join(", ")}`);
    }
    return { status: body.status };
}

export function sanitizePlate(placa) {
    return String(placa).trim().toUpperCase();
}

// checa se data+hora são no passado (aproximação sem fuso explícito)
export function isPastDateTime(dateStr, timeStr /*, tz */) {
    // cria um Date local "YYYY-MM-DDTHH:mm:00"
    const dt = new Date(`${dateStr}T${timeStr}:00`);
    if (Number.isNaN(dt.getTime())) return true;
    const now = new Date();
    return dt.getTime() < now.getTime();
}
