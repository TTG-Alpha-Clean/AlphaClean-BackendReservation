// src/middlewares/errorHandler.js - CORRIGIDO
import ApiError from "../utils/apiError.js"; // ⚠️ Verificar se o arquivo existe

export default function errorHandler(err, req, res, _next) {
    // ✅ Log detalhado para debug
    console.error("🚨 Error Handler:", {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        isApiError: err instanceof ApiError,
        stack: err.stack?.split('\n').slice(0, 3) // Primeiras 3 linhas
    });

    // ✅ ApiError conhecido - DEVE retornar o status correto
    if (err instanceof ApiError) {
        console.log(`📤 Retornando status: ${err.statusCode}`);
        const body = { error: err.message };

        if (process.env.NODE_ENV !== "production") {
            body.stack = err.stack;
            if (err.cause) body.cause = String(err.cause);
        }

        return res.status(err.statusCode).json(body);
    }

    // ✅ Se não é ApiError, mas tem statusCode (pode ser erro customizado)
    if (err.statusCode && typeof err.statusCode === 'number') {
        console.log(`📤 Erro com statusCode: ${err.statusCode}`);
        return res.status(err.statusCode).json({
            error: err.message || "Erro conhecido"
        });
    }

    // ✅ Erros de validação
    if (err?.name === "ZodError" && Array.isArray(err.issues)) {
        console.log("📤 Erro de validação Zod");
        return res.status(400).json({
            error: "Validation error",
            issues: err.issues.map(i => ({ path: i.path, message: i.message }))
        });
    }

    // ✅ Erros de banco PostgreSQL
    if (err?.code) {
        console.error("🗄️ Database Error:", err.code, err.message);

        switch (err.code) {
            case '23505': // unique_violation
                return res.status(409).json({ error: "Recurso já existe" });
            case '23502': // not_null_violation
                return res.status(400).json({ error: "Campo obrigatório não informado" });
            case '23514': // check_violation
                return res.status(400).json({ error: "Dados inválidos" });
            case '42P01': // undefined_table
                return res.status(500).json({ error: "Tabela não encontrada no banco" });
            default:
                console.error("❓ Erro de banco não tratado:", err.code);
                return res.status(500).json({ error: "Erro interno do banco de dados" });
        }
    }

    // ✅ Fallback para erros desconhecidos
    console.error("❓ Erro não identificado:", err);

    const status = 500;
    const body = { error: "Erro interno do servidor" };

    if (process.env.NODE_ENV !== "production") {
        body.originalMessage = err?.message;
        body.stack = err?.stack;
        body.errorType = err?.constructor?.name;
    }

    return res.status(status).json(body);
}