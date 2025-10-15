// src/middlewares/errorHandler.ts - SOLUÇÃO COMPLETA
import { Request, Response, NextFunction } from 'express';

// ✅ Definir interfaces localmente para evitar problemas de import
interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    cause?: any;
    issues?: any[];
}

interface DatabaseError extends Error {
    code?: string;
    detail?: string;
    table?: string;
    constraint?: string;
}

interface ZodError extends Error {
    issues: Array<{
        path: (string | number)[];
        message: string;
        code: string;
    }>;
}

// ✅ Interface para resposta padronizada
interface ErrorResponse {
    error: string;
    statusCode?: number;
    details?: any;
    timestamp?: string;
    path?: string;
}

export default function errorHandler(
    err: CustomError | DatabaseError | ZodError | Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {

    // ✅ Log do erro para debug
    console.error("🚨 Error Handler:", {
        name: err.name,
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 3),
        url: req.url,
        method: req.method
    });

    // ✅ Função helper para enviar resposta
    const sendErrorResponse = (statusCode: number, message: string, details?: any): void => {
        const response: ErrorResponse = {
            error: message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.url
        };

        if (details && process.env.NODE_ENV !== 'production') {
            response.details = details;
        }

        res.status(statusCode).json(response);
    };

    // ✅ 1. Erros com statusCode (ApiError, etc.)
    const customError = err as CustomError;
    if (customError.statusCode && typeof customError.statusCode === 'number') {
        console.log(`📤 ApiError - Status: ${customError.statusCode}`);
        sendErrorResponse(
            customError.statusCode,
            customError.message,
            process.env.NODE_ENV !== 'production' ? customError.stack : undefined
        );
        return;
    }

    // ✅ 2. Erros de validação Zod
    if (err.name === 'ZodError') {
        console.log("📤 Erro de validação Zod");
        const zodError = err as ZodError;
        sendErrorResponse(
            400,
            "Dados inválidos",
            zodError.issues?.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }))
        );
        return;
    }

    // ✅ 3. Erros de banco PostgreSQL
    const dbError = err as DatabaseError;
    if (dbError.code) {
        console.error(`🗄️ Database Error [${dbError.code}]:`, dbError.message);

        switch (dbError.code) {
            case '23505': // unique_violation
                sendErrorResponse(409, "Recurso já existe");
                return;

            case '23502': // not_null_violation
                sendErrorResponse(400, "Campo obrigatório não informado");
                return;

            case '23503': // foreign_key_violation
                sendErrorResponse(400, "Referência inválida");
                return;

            case '23514': // check_violation
                sendErrorResponse(400, "Dados inválidos");
                return;

            case '42P01': // undefined_table
                sendErrorResponse(500, "Recurso não encontrado no sistema");
                return;

            case '42703': // undefined_column
                sendErrorResponse(500, "Campo não encontrado");
                return;

            case '08006': // connection_failure
            case '08001': // connection_unable
                sendErrorResponse(503, "Serviço temporariamente indisponível");
                return;

            default:
                console.error("❓ Código de erro de banco não tratado:", dbError.code);
                sendErrorResponse(500, "Erro interno do banco de dados");
                return;
        }
    }

    // ✅ 4. Erros de sintaxe JSON
    if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        console.log("📤 Erro de JSON inválido");
        sendErrorResponse(400, "Formato JSON inválido");
        return;
    }

    // ✅ 5. Erros de timeout
    if (err.name === 'TimeoutError' || (err.message && err.message.includes('timeout'))) {
        console.log("📤 Erro de timeout");
        sendErrorResponse(408, "Tempo limite esgotado");
        return;
    }

    // ✅ 6. Erros de conexão
    if (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND'))) {
        console.log("📤 Erro de conexão");
        sendErrorResponse(503, "Serviço indisponível");
        return;
    }

    // ✅ 7. Fallback - Erro genérico
    console.error("❓ Erro não identificado:", {
        name: err.name,
        message: err.message,
        constructor: err.constructor.name
    });

    sendErrorResponse(
        500,
        "Erro interno do servidor",
        process.env.NODE_ENV !== 'production' ? {
            name: err.name,
            message: err.message,
            stack: err.stack
        } : undefined
    );
}