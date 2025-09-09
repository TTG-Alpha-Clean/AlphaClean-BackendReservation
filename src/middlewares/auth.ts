// src/middlewares/auth.ts - VERSÃO SIMPLIFICADA
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/interfaces';
import { verifyJWT } from "../utils/jwt";

export function requireUser(req: AuthenticatedRequest & Request, res: Response, next: NextFunction) {
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
        const payload = verifyJWT(token, { secret: process.env.JWT_SECRET || "dev" });

        // ✅ SOLUÇÃO: Apenas id e role (conforme interface original)
        req.user = {
            id: payload.sub,
            role: payload.role === "admin" ? "admin" : "user"
        };

        next();
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Apenas admin" });
    }
    next();
}