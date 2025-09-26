// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';

import { validateRegister, validateLogin, validateRole } from "../utils/userValidators";
import * as userSvc from "../services/userService";
import { signJWT, verifyJWT } from "../utils/jwt";

// Helper para async handlers
const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    const parsed = validateRegister(req.body);
    const requestedRole = parsed.role;

    // Regra: permitir admin apenas se ainda não houver admin na base
    let finalRole: 'user' | 'admin' = "user";
    if (requestedRole === "admin") {
        const anyAdmin = await userSvc.hasAnyAdmin();
        if (!anyAdmin) {
            finalRole = "admin";
        }
    }

    // Valida role final
    validateRole(finalRole);

    const created = await userSvc.createUser({
        nome: parsed.nome,
        email: parsed.email,
        senha: parsed.senha,
        role: finalRole,
        telefones: parsed.telefones,
    });

    res.status(201).json(created);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, senha } = validateLogin(req.body);
    const user = await userSvc.login({ email, senha });

    const token = signJWT(
        { sub: user.id, role: user.role },
        {
            secret: process.env.JWT_SECRET || "dev",
            expiresInSec: Number(process.env.JWT_EXPIRES_IN || 3600)
        }
    );

    // Retorna o token como Bearer token no response
    res.json({
        token,
        user,
        tokenType: "Bearer",
        expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600)
    });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;

    if (!token) {
        return res.status(401).json({ error: "Não autenticado" });
    }

    try {
        const payload = verifyJWT(token, { secret: process.env.JWT_SECRET || "dev" });
        const user = await userSvc.getById(payload.sub);

        if (!user || !user.active) {
            return res.status(401).json({ error: "Usuário inativo" });
        }

        res.json({
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                active: user.active
            }
        });
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    // Com Bearer tokens, o logout é feito no frontend removendo o token
    // Aqui só confirmamos o logout
    res.json({ message: "Logout realizado com sucesso" });
});