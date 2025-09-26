"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.authenticatedHandler = authenticatedHandler;
// AsyncHandler genérico
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// AsyncHandler específico para rotas autenticadas
function authenticatedHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Exportação padrão (compatível com JS)
exports.default = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map