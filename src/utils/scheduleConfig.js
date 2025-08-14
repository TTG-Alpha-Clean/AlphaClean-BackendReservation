// Configuração do agendamento (ajuste livremente)
export const SCHEDULE = {
    TZ: "America/Bahia",
    OPEN: process.env.SLOT_OPEN || "08:00",       // abertura
    CLOSE: process.env.SLOT_CLOSE || "18:00",     // fechamento
    SLOT_MINUTES: Number(process.env.SLOT_MINUTES || 30),
    MAX_CONCURRENT: Number(process.env.SLOT_CAPACITY || 1), // carros por slot
};

// Gera a grade do dia com base em OPEN/CLOSE e SLOT_MINUTES
export function buildSlotsOfDay() {
    const [oh, om] = SCHEDULE.OPEN.split(":").map(Number);
    const [ch, cm] = SCHEDULE.CLOSE.split(":").map(Number);
    const open = oh * 60 + om;
    const close = ch * 60 + cm;

    const slots = [];
    for (let m = open; m + SCHEDULE.SLOT_MINUTES <= close; m += SCHEDULE.SLOT_MINUTES) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        slots.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    }
    return slots;
}
