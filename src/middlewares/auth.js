
// src/middlewares/auth.js
import { verifyJWT } from "../utils/jwt.js";

export function requireUser(req, res, next) {
    const auth = req.headers.authorization || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    const cookieToken = typeof req.cookies?.access_token === "string" && req.cookies.access_token.trim() ? req.cookies.access_token.trim() : null;
    const token = bearer || cookieToken;
    if (!token) return res.status(401).json({ error: "Não autenticado" });

    try {
        const payload = verifyJWT(token, { secret: process.env.JWT_SECRET || "dev" });
        req.user = { id: payload.sub, role: payload.role || "user" };
        next();
    } catch {
        res.status(401).json({ error: "Token inválido" });
    }
}


export function requireAdmin(req, res, next) {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Apenas admin" });
    next();
}
