// src/middlewares/errorHandler.js
import ApiError from "../utils/apiError.js";

export default function errorHandler(err, req, res, _next) {
    // ApiError conhecido
    if (err instanceof ApiError) {
        const body = { error: err.message };
        if (process.env.NODE_ENV !== "production") {
            body.stack = err.stack;
            if (err.cause) body.cause = String(err.cause);
        }
        return res.status(err.statusCode).json(body);
    }

    // Erros de validação comuns (ex.: Zod) — opcional
    if (err?.name === "ZodError" && Array.isArray(err.issues)) {
        return res.status(400).json({
            error: "Validation error",
            issues: err.issues.map(i => ({ path: i.path, message: i.message }))
        });
    }

    // Fallback
    const status = 500;
    const body = { error: "Erro interno do servidor" };
    if (process.env.NODE_ENV !== "production") {
        body.stack = err?.stack;
        if (err?.message) body.message = err.message;
    }
    return res.status(status).json(body);
}
