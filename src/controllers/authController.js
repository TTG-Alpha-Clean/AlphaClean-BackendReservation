import asyncHandler from "../utils/asyncHandler.js";
import { validateRegister, validateLogin, validateRole } from "../utils/userValidators.js";
import * as userSvc from "../services/userService.js";
import { signJWT, verifyJWT } from "../utils/jwt.js";

export const register = asyncHandler(async (req, res) => {
    const parsed = validateRegister(req.body);
    // role pedido no body (pode ser undefined)
    const requestedRole = parsed.role;

    // regra: permitir admin apenas se ainda não houver admin na base
    let finalRole = "user";
    if (requestedRole === "admin") {
        const anyAdmin = await userSvc.hasAnyAdmin();
        if (!anyAdmin) {
            finalRole = "admin";
        }
    }

    // valida role final (apenas "user" | "admin")
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

export const login = asyncHandler(async (req, res) => {
    const { email, senha } = validateLogin(req.body);
    const user = await userSvc.login({ email, senha });
    const token = signJWT(
        { sub: user.id, role: user.role },
        { secret: process.env.JWT_SECRET || "dev", expiresInSec: Number(process.env.JWT_EXPIRES_IN || 3600) }
    );

    const maxAge = 1000 * Number(process.env.JWT_EXPIRES_IN || 3600);

    // seta cookie httpOnly com o token
    res.setCookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    });

    // seta cookies espelho para o middleware do Next.js conseguir ler
    res.setCookie("has_session", "1", {
        httpOnly: false, // permite JS ler
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    });

    res.setCookie("role", user.role, {
        httpOnly: false, // permite JS ler
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    });

    res.json({ token, user });
});

// Nova rota para verificar se o usuário está logado
export const me = asyncHandler(async (req, res) => {
    const auth = req.headers.authorization || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    const cookieToken = typeof req.cookies?.access_token === "string" && req.cookies.access_token.trim() ? req.cookies.access_token.trim() : null;
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

// Rota para logout
export const logout = asyncHandler(async (req, res) => {
    // Remove os cookies
    res.setCookie("access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });

    res.setCookie("has_session", "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });

    res.setCookie("role", "", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
    });

    res.json({ message: "Logout realizado com sucesso" });
});