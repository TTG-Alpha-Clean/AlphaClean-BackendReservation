// src/utils/apiError.ts - VERSÃO TYPESCRIPT
export default class ApiError extends Error {
    public statusCode: number;
    public cause?: any;

    constructor(statusCode: number, message: string, cause?: any) {
        super(message);
        this.name = "ApiError";
        this.statusCode = Number.isInteger(statusCode) ? statusCode : 500;
        if (cause) this.cause = cause;

        // Captura stack trace se disponível
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }

    static badRequest(msg: string, cause?: any): ApiError {
        return new ApiError(400, msg, cause);
    }

    static unauthorized(msg: string, cause?: any): ApiError {
        return new ApiError(401, msg, cause);
    }

    static forbidden(msg: string, cause?: any): ApiError {
        return new ApiError(403, msg, cause);
    }

    static notFound(msg: string, cause?: any): ApiError {
        return new ApiError(404, msg, cause);
    }

    static conflict(msg: string, cause?: any): ApiError {
        return new ApiError(409, msg, cause);
    }

    static internal(msg: string, cause?: any): ApiError {
        return new ApiError(500, msg, cause);
    }
}