"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = requireUser;
exports.requireAdmin = requireAdmin;
const jwt_1 = require("../utils/jwt");
function requireUser(req, res, next) {
    const auth = req.headers['authorization'] || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    const cookieToken = typeof req.cookies?.access_token === "string" &&
        req.cookies.access_token.trim() ?
        req.cookies.access_token.trim() : null;
    const token = bearer || cookieToken;
    if (!token) {
        return res.status(401).json({ error: "Não autenticado" });
    }
    try {
        const payload = (0, jwt_1.verifyJWT)(token, { secret: process.env.JWT_SECRET || "dev" });
        // ✅ SOLUÇÃO: Apenas id e role (conforme interface original)
        req.user = {
            id: payload.sub,
            role: payload.role === "admin" ? "admin" : "user"
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Apenas admin" });
    }
    next();
}
//# sourceMappingURL=auth.js.map