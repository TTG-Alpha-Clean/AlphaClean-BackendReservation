import asyncHandler from "../utils/asyncHandler.js";
import { validateRegister, validateLogin, validateRole } from "../utils/userValidators.js";
import * as userSvc from "../services/userService.js";
import { signJWT } from "../utils/jwt.js";

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

    // seta cookie httpOnly com o token
    res.setCookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // em dev fica false (ok com http://localhost)
        sameSite: "lax",
        path: "/",
        maxAge: 1000 * Number(process.env.JWT_EXPIRES_IN || 3600)
    });

    res.json({ token, user });
});
