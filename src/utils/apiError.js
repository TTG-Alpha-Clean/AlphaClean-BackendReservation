// src/utils/ApiError.js
export default class ApiError extends Error {
    constructor(statusCode, message, cause) {
        super(message);
        this.name = "ApiError";
        this.statusCode = Number.isInteger(statusCode) ? statusCode : 500;
        if (cause) this.cause = cause;
        if (Error.captureStackTrace) Error.captureStackTrace(this, ApiError);
    }

    static badRequest(msg, cause) { return new ApiError(400, msg, cause); }
    static unauthorized(msg, cause) { return new ApiError(401, msg, cause); }
    static forbidden(msg, cause) { return new ApiError(403, msg, cause); }
    static notFound(msg, cause) { return new ApiError(404, msg, cause); }
    static conflict(msg, cause) { return new ApiError(409, msg, cause); }
    static internal(msg, cause) { return new ApiError(500, msg, cause); }
}
