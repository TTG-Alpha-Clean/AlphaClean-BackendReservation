// src/utils/statusMachine.ts - VERSÃO SIMPLIFICADA SEM EM_ANDAMENTO

// ✅ TRANSIÇÕES SIMPLIFICADAS - APENAS 3 STATUS
const transitions: Record<string, Set<string>> = {
    agendado: new Set(["cancelado", "finalizado"]),
    cancelado: new Set([]), // Status final
    finalizado: new Set([]), // Status final
};

export function canTransition(from: string, to: string): boolean {
    const allowed = transitions[from];
    return !!allowed && allowed.has(to);
}

export function isTerminalStatus(st: string): boolean {
    return st === "finalizado" || st === "cancelado";
}

// ✅ FUNÇÃO PARA VALIDAR PERMISSÕES POR ROLE
export function canUserChangeStatus(currentStatus: string, newStatus: string, userRole: string): boolean {
    // Clientes só podem cancelar seus próprios agendamentos
    if (userRole !== "admin") {
        return currentStatus === "agendado" && newStatus === "cancelado";
    }

    // Admins podem fazer qualquer transição válida
    return canTransition(currentStatus, newStatus);
}

// ✅ STATUS VÁLIDOS DO SISTEMA
export const VALID_STATUS = ["agendado", "cancelado", "finalizado"];

export function isValidStatus(status: string): boolean {
    return VALID_STATUS.includes(status);
}