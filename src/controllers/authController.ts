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

    const maxAge = 1000 * Number(process.env.JWT_EXPIRES_IN || 3600);

    // Seta cookie httpOnly com o token
    res.cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    });

    // Seta cookies espelho para o middleware do Next.js conseguir ler
    res.cookie("has_session", "1", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    });

    res.cookie("role", user.role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    });

    res.json({ token, user });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
    const auth = req.headers.authorization || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    const cookieToken = typeof (req as any).cookies?.access_token === "string" &&
        (req as any).cookies.access_token.trim() ?
        (req as any).cookies.access_token.trim() : null;
    const token = bearer || cookieToken;

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
    // Remove os cookies
    res.cookie("access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });

    res.cookie("has_session", "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });

    res.cookie("role", "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });

    res.json({ message: "Logout realizado com sucesso" });
});