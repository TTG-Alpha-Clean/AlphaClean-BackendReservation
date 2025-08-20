// Configuração do agendamento (ajuste livremente)
export const SCHEDULE = {
    TZ: "America/Bahia",
    OPEN: process.env.SLOT_OPEN || "08:00",       // abertura
    CLOSE: process.env.SLOT_CLOSE || "18:00",     // fechamento
    SLOT_MINUTES: Number(process.env.SLOT_MINUTES || 50), // 50 minutos entre lavagens
    MAX_CONCURRENT: Number(process.env.SLOT_CAPACITY || 1), // carros por slot
    LUNCH_START: "12:00", // início do almoço
    LUNCH_END: "13:00",   // fim do almoço
};

// Gera a grade do dia com base em OPEN/CLOSE e SLOT_MINUTES, excluindo horário de almoço
export function buildSlotsOfDay() {
    const [oh, om] = SCHEDULE.OPEN.split(":").map(Number);
    const [ch, cm] = SCHEDULE.CLOSE.split(":").map(Number);
    const [lh_start, lm_start] = SCHEDULE.LUNCH_START.split(":").map(Number);
    const [lh_end, lm_end] = SCHEDULE.LUNCH_END.split(":").map(Number);

    const open = oh * 60 + om;
    const close = ch * 60 + cm;
    const lunchStart = lh_start * 60 + lm_start;
    const lunchEnd = lh_end * 60 + lm_end;

    const slots = [];
    for (let m = open; m + SCHEDULE.SLOT_MINUTES <= close; m += SCHEDULE.SLOT_MINUTES) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        const timeSlot = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

        // Pula horários que coincidem com o almoço (12:00 - 13:00)
        if (m >= lunchStart && m < lunchEnd) {
            continue;
        }

        slots.push(timeSlot);
    }
    return slots;
}