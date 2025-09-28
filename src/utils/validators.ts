// src/utils/validators.ts - VERSÃO TYPESCRIPT
import ApiError from "./apiError";

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;     // YYYY-MM-DD
const TIME_RX = /^\d{2}:\d{2}$/;           // HH:mm
const PLATE_RX_MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/; // ABC1D23 (Mercosul)
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Interface para payload de criação
interface CreatePayload {
    usuario_id: string;
    modelo_veiculo: string;
    cor?: string | null;
    placa: string;
    servico_id: string;
    data: string;
    horario: string;
    observacoes?: string | null;
}

// Interface para payload de atualização
interface UpdatePayload {
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

// Interface para mudança de status
interface StatusPayload {
    status: string;
}

export function assertCreatePayload(body: any): CreatePayload {
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

export function assertUpdatePayload(body: any): UpdatePayload {
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
        servico_id: String(body.servico_id),
        data: body.data,
        horario: body.horario,
        observacoes: body.observacoes ? String(body.observacoes) : null,
    };
}

export function assertReschedulePayload(body: any): ReschedulePayload {
    if (!body?.data || !DATE_RX.test(body.data)) throw new ApiError(400, "data (YYYY-MM-DD) é obrigatória");
    if (!body?.horario || !TIME_RX.test(body.horario)) throw new ApiError(400, "horario (HH:mm) é obrigatório");
    return { data: body.data, horario: body.horario };
}

// Apenas 3 status permitidos
export function assertStatusPayload(body: any): StatusPayload {
    const allowed = ["agendado", "finalizado", "cancelado"];
    if (!body?.status || !allowed.includes(body.status)) {
        throw new ApiError(400, `status inválido. Valores permitidos: ${allowed.join(", ")}`);
    }
    return { status: body.status };
}

export function isPastDateTime(data: string, horario: string): boolean {
    // Criar a data do agendamento no fuso horário de São Paulo
    const agendamento = new Date(`${data}T${horario}:00-03:00`);

    // Obter a data atual no fuso horário de São Paulo
    const agora = new Date();
    const agoraSaoPaulo = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));

    return agendamento < agoraSaoPaulo;
}

export function sanitizePlate(placa: string): string {
    if (!placa) return "";
    const clean = String(placa).toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (clean.length === 7) {
        return clean.slice(0, 3) + clean.slice(3, 4) + clean.slice(4, 5) + clean.slice(5, 7);
    }

    return clean;
}