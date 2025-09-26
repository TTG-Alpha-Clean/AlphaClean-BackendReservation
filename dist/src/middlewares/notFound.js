"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = notFound;
function notFound(req, res) {
    res.status(404).json({
        error: "Rota não encontrada",
        path: req.originalUrl,
        method: req.method
    });
}
//# sourceMappingURL=notFound.js.map