"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
exports.adminLogout = adminLogout;
const adminServices_1 = require("../services/adminServices");
async function adminLogin(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Informe email e senha.' });
    }
    const result = await (0, adminServices_1.loginAdmin)(email, password);
    if (!result.ok) {
        return res.status(result.status || 401).json({ error: result.msg });
    }
    // Retorna o token como Bearer token no response
    return res.json({
        message: 'Login realizado com sucesso',
        token: result.token,
        tokenType: 'Bearer',
        expiresIn: 3600, // 1 hora em segundos
        user: {
            id: result.admin.id,
            nome: result.admin.nome,
            email: result.admin.email,
            role: 'admin',
            active: true
        }
    });
}
function adminLogout(req, res) {
    // Com Bearer tokens, o logout é feito no frontend removendo o token
    // Aqui só confirmamos o logout
    return res.json({ message: 'Logout realizado com sucesso' });
}
//# sourceMappingURL=adminControllers.js.map