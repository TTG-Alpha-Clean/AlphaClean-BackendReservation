"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.me = exports.login = exports.register = void 0;
const userValidators_1 = require("../utils/userValidators");
const userSvc = __importStar(require("../services/userService"));
const jwt_1 = require("../utils/jwt");
// Helper para async handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.register = asyncHandler(async (req, res) => {
    const parsed = (0, userValidators_1.validateRegister)(req.body);
    const requestedRole = parsed.role;
    // Regra: permitir admin apenas se ainda não houver admin na base
    let finalRole = "user";
    if (requestedRole === "admin") {
        const anyAdmin = await userSvc.hasAnyAdmin();
        if (!anyAdmin) {
            finalRole = "admin";
        }
    }
    // Valida role final
    (0, userValidators_1.validateRole)(finalRole);
    const created = await userSvc.createUser({
        nome: parsed.nome,
        email: parsed.email,
        senha: parsed.senha,
        role: finalRole,
        telefones: parsed.telefones,
    });
    res.status(201).json(created);
});
exports.login = asyncHandler(async (req, res) => {
    const { email, senha } = (0, userValidators_1.validateLogin)(req.body);
    const user = await userSvc.login({ email, senha });
    const token = (0, jwt_1.signJWT)({ sub: user.id, role: user.role }, {
        secret: process.env.JWT_SECRET || "dev",
        expiresInSec: Number(process.env.JWT_EXPIRES_IN || 3600)
    });
    // Retorna o token como Bearer token no response
    res.json({
        token,
        user,
        tokenType: "Bearer",
        expiresIn: Number(process.env.JWT_EXPIRES_IN || 3600)
    });
});
exports.me = asyncHandler(async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    if (!token) {
        res.status(401).json({ error: "Não autenticado" });
        return;
    }
    try {
        const payload = (0, jwt_1.verifyJWT)(token, { secret: process.env.JWT_SECRET || "dev" });
        const user = await userSvc.getById(payload.sub);
        if (!user || !user.active) {
            res.status(401).json({ error: "Usuário inativo" });
            return;
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
    }
    catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
});
exports.logout = asyncHandler(async (req, res) => {
    // Com Bearer tokens, o logout é feito no frontend removendo o token
    // Aqui só confirmamos o logout
    res.json({ message: "Logout realizado com sucesso" });
});
//# sourceMappingURL=authController.js.map