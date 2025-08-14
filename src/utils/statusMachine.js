const transitions = {
    agendado: new Set(["em_andamento", "cancelado"]),
    em_andamento: new Set(["finalizado", "cancelado"]),
    finalizado: new Set([]),
    cancelado: new Set([]),
};

export function canTransition(from, to) {
    const allowed = transitions[from];
    return !!allowed && allowed.has(to);
}

export function isTerminalStatus(st) {
    return st === "finalizado" || st === "cancelado";
}
