// src/middlewares/errorHandler.js
import ApiError from "../utils/apiError.js"; // Corrigido: importação com 'a' minúsculo

export default function errorHandler(err, req, res, _next) {
    console.error("Error Handler:", err); // Log para debug

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

    // Erros de banco de dados PostgreSQL
    if (err?.code) {
        console.error("Database Error Code:", err.code, err.message);

        switch (err.code) {
            case '23505': // unique_violation
                return res.status(409).json({ error: "Email já cadastrado" });
            case '23502': // not_null_violation
                return res.status(400).json({ error: "Campo obrigatório não informado" });
            case '23514': // check_violation
                return res.status(400).json({ error: "Dados inválidos" });
            default:
                console.error("Unhandled DB error:", err);
        }
    }

    // Fallback
    const status = 500;
    const body = { error: "Erro interno do servidor" };
    if (process.env.NODE_ENV !== "production") {
        body.stack = err?.stack;
        body.originalError = err?.message;
        if (err?.cause) body.cause = String(err.cause);
    }
    return res.status(status).json(body);
}