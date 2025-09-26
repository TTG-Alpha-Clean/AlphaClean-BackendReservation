"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = loginAdmin;
const index_1 = require("../database/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function loginAdmin(email, password) {
    const { rows } = await index_1.pool.query('SELECT id, nome, email, senha FROM usuarios WHERE email = $1 AND role = $2 LIMIT 1', [email, 'admin']);
    if (!rows.length) {
        return { ok: false, status: 401, msg: 'Credenciais inválidas.' };
    }
    const admin = rows[0];
    const isMatch = await bcryptjs_1.default.compare(password, admin.senha);
    if (!isMatch) {
        return { ok: false, status: 401, msg: 'Credenciais inválidas.' };
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET não está definida nas variáveis de ambiente.');
    }
    // Set proper expiration time in seconds (1 hour = 3600 seconds)
    const expiresIn = '1h';
    const payload = {
        sub: admin.id,
        role: 'admin',
        email: admin.email,
        nome: admin.nome
    };
    const options = {
        algorithm: 'HS256',
        expiresIn
    };
    const token = jsonwebtoken_1.default.sign(payload, secret, options);
    return {
        ok: true,
        token,
        admin: {
            id: admin.id,
            email: admin.email,
            nome: admin.nome
        }
    };
}
//# sourceMappingURL=adminServices.js.map