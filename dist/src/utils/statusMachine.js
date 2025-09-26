"use strict";
// src/utils/statusMachine.ts - VERSÃO SIMPLIFICADA SEM EM_ANDAMENTO
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUS = void 0;
exports.canTransition = canTransition;
exports.isTerminalStatus = isTerminalStatus;
exports.canUserChangeStatus = canUserChangeStatus;
exports.isValidStatus = isValidStatus;
// ✅ TRANSIÇÕES SIMPLIFICADAS - APENAS 3 STATUS
const transitions = {
    agendado: new Set(["cancelado", "finalizado"]),
    cancelado: new Set([]), // Status final
    finalizado: new Set([]), // Status final
};
function canTransition(from, to) {
    const allowed = transitions[from];
    return !!allowed && allowed.has(to);
}
function isTerminalStatus(st) {
    return st === "finalizado" || st === "cancelado";
}
// ✅ FUNÇÃO PARA VALIDAR PERMISSÕES POR ROLE
function canUserChangeStatus(currentStatus, newStatus, userRole) {
    // Clientes só podem cancelar seus próprios agendamentos
    if (userRole !== "admin") {
        return currentStatus === "agendado" && newStatus === "cancelado";
    }
    // Admins podem fazer qualquer transição válida
    return canTransition(currentStatus, newStatus);
}
// ✅ STATUS VÁLIDOS DO SISTEMA
exports.VALID_STATUS = ["agendado", "cancelado", "finalizado"];
function isValidStatus(status) {
    return exports.VALID_STATUS.includes(status);
}
//# sourceMappingURL=statusMachine.js.map