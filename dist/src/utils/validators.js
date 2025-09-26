"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCreatePayload = assertCreatePayload;
exports.assertUpdatePayload = assertUpdatePayload;
exports.assertReschedulePayload = assertReschedulePayload;
exports.assertStatusPayload = assertStatusPayload;
exports.isPastDateTime = isPastDateTime;
exports.sanitizePlate = sanitizePlate;
// src/utils/validators.ts - VERSÃO TYPESCRIPT
const apiError_1 = __importDefault(require("./apiError"));
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const TIME_RX = /^\d{2}:\d{2}$/; // HH:mm
const PLATE_RX_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/; // ABC1D23 (Mercosul)
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertCreatePayload(body) {
    const required = ["modelo_veiculo", "placa", "servico_id", "data", "horario"];
    for (const k of required) {
        if (!body[k])
            throw new apiError_1.default(400, `Campo obrigatório: ${k}`);
    }
    if (!DATE_RX.test(body.data))
        throw new apiError_1.default(400, "data deve ser YYYY-MM-DD");
    if (!TIME_RX.test(body.horario))
        throw new apiError_1.default(400, "horario deve ser HH:mm");
    if (!PLATE_RX_MERCOSUL.test(String(body.placa).toUpperCase())) {
        throw new apiError_1.default(400, "placa inválida (formato Mercosul: ABC1D23)");
    }
    if (!UUID_RX.test(body.servico_id)) {
        throw new apiError_1.default(400, "servico_id deve ser um UUID válido");
    }
    return {
        usuario_id: body.usuario_id,
        modelo_veiculo: String(body.modelo_veiculo),
        cor: body.cor ? String(body.cor) : null,
        placa: String(body.placa).toUpperCase(),
        servico_id: String(body.servico_id),
        data: body.data,
        horario: body.horario,
        observacoes: body.observacoes ? String(body.observacoes) : null,
    };
}
function assertUpdatePayload(body) {
    const required = ["modelo_veiculo", "placa", "servico_id", "data", "horario"];
    for (const k of required) {
        if (!body[k])
            throw new apiError_1.default(400, `Campo obrigatório: ${k}`);
    }
    if (!DATE_RX.test(body.data))
        throw new apiError_1.default(400, "data deve ser YYYY-MM-DD");
    if (!TIME_RX.test(body.horario))
        throw new apiError_1.default(400, "horario deve ser HH:mm");
    if (!PLATE_RX_MERCOSUL.test(String(body.placa).toUpperCase())) {
        throw new apiError_1.default(400, "placa inválida (formato Mercosul: ABC1D23)");
    }
    if (!UUID_RX.test(body.servico_id)) {
        throw new apiError_1.default(400, "servico_id deve ser um UUID válido");
    }
    return {
        modelo_veiculo: String(body.modelo_veiculo),
        cor: body.cor ? String(body.cor) : null,
        placa: String(body.placa).toUpperCase(),
        servico_id: String(body.servico_id),
        data: body.data,
        horario: body.horario,
        observacoes: body.observacoes ? String(body.observacoes) : null,
    };
}
function assertReschedulePayload(body) {
    if (!body?.data || !DATE_RX.test(body.data))
        throw new apiError_1.default(400, "data (YYYY-MM-DD) é obrigatória");
    if (!body?.horario || !TIME_RX.test(body.horario))
        throw new apiError_1.default(400, "horario (HH:mm) é obrigatório");
    return { data: body.data, horario: body.horario };
}
// Apenas 3 status permitidos
function assertStatusPayload(body) {
    const allowed = ["agendado", "finalizado", "cancelado"];
    if (!body?.status || !allowed.includes(body.status)) {
        throw new apiError_1.default(400, `status inválido. Valores permitidos: ${allowed.join(", ")}`);
    }
    return { status: body.status };
}
function isPastDateTime(data, horario) {
    const agendamento = new Date(`${data}T${horario}:00`);
    const agora = new Date();
    return agendamento < agora;
}
function sanitizePlate(placa) {
    if (!placa)
        return "";
    const clean = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length === 7) {
        return clean.slice(0, 3) + clean.slice(3, 4) + clean.slice(4, 5) + clean.slice(5, 7);
    }
    return clean;
}
//# sourceMappingURL=validators.js.map