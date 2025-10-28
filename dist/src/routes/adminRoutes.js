"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminControllers_1 = require("../controllers/adminControllers");
const autoFinalizacaoService_1 = require("../services/autoFinalizacaoService");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.post('/login', adminControllers_1.adminLogin);
router.post('/logout', adminControllers_1.adminLogout);
// Rota para executar manualmente a finalização automática de agendamentos
router.post('/auto-finalize', (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    // Verificar se é admin
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem executar esta ação' });
        return;
    }
    const result = await (0, autoFinalizacaoService_1.executeAutoFinalizacao)();
    res.json(result);
}));
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map