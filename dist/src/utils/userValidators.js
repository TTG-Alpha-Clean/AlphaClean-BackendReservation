"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = validateRegister;
exports.validateLogin = validateLogin;
exports.validateRole = validateRole;
// src/utils/userValidators.ts - VERSÃO TYPESCRIPT
const apiError_1 = __importDefault(require("./apiError"));
const EMAIL_RX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const DDD_RX = /^[0-9]{2}$/;
const NUM_RX = /^9[0-9]{8}$/;
function validateRegister(body) {
    const { nome, email, senha, telefones } = body || {};
    if (!nome || String(nome).trim().length < 2) {
        throw new apiError_1.default(400, "nome deve ter pelo menos 2 caracteres");
    }
    if (!email || !EMAIL_RX.test(String(email))) {
        throw new apiError_1.default(400, "email inválido");
    }
    if (!senha || String(senha).length < 6) {
        throw new apiError_1.default(400, "senha deve ter pelo menos 6 caracteres");
    }
    let tels = [];
    if (Array.isArray(telefones) && telefones.length > 0) {
        tels = telefones
            .filter(t => t.ddd && t.numero) // Filtra telefones vazios
            .map(t => ({
            ddd: String(t.ddd || ""),
            numero: String(t.numero || ""),
            is_whatsapp: !!t.is_whatsapp,
        }));
        for (const t of tels) {
            if (!DDD_RX.test(t.ddd) || t.ddd === "00") {
                throw new apiError_1.default(400, "DDD inválido");
            }
            if (!NUM_RX.test(t.numero)) {
                throw new apiError_1.default(400, "número inválido (formato 9XXXXXXXX)");
            }
        }
    }
    const role = body?.role ? String(body.role).toLowerCase() : undefined; // "admin" ou "user"
    return {
        nome: String(nome).trim(),
        email: String(email).toLowerCase(),
        senha: String(senha),
        telefones: tels,
        role, // retorna role se enviado
    };
}
function validateLogin(body) {
    const { email, senha } = body || {};
    if (!email || !EMAIL_RX.test(String(email))) {
        throw new apiError_1.default(400, "email inválido");
    }
    if (!senha) {
        throw new apiError_1.default(400, "senha obrigatória");
    }
    return {
        email: String(email).toLowerCase(),
        senha: String(senha)
    };
}
function validateRole(role) {
    const allowed = ["user", "admin"];
    if (!allowed.includes(role)) {
        throw new apiError_1.default(400, `role inválida. Use: ${allowed.join(", ")}`);
    }
}
//# sourceMappingURL=userValidators.js.map