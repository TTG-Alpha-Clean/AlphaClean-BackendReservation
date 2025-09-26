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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/agendamentoRoutes.ts
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const controller = __importStar(require("../controllers/agendamentoController"));
const router = express_1.default.Router();
// Log para verificar se as rotas estão sendo carregadas
console.log("🔍 ROTAS - Carregando rotas de agendamentos...");
// Rotas públicas (slots disponíveis)
router.get("/slots", controller.getDailySlots);
console.log("✅ ROTA - GET /slots registrada");
// Middleware de autenticação para todas as rotas abaixo
router.use(auth_1.requireUser);
// ROTAS ESPECÍFICAS PRIMEIRO
router.patch("/:id/reschedule", (req, res, next) => {
    console.log("🔍 ROTA PATCH /:id/reschedule chamada para ID:", req.params.id);
    controller.reschedule(req, res, next);
});
router.patch("/:id/status", (req, res, next) => {
    console.log("🔍 ROTA PATCH /:id/status chamada para ID:", req.params.id);
    controller.updateStatus(req, res, next);
});
router.delete("/:id/cancel", (req, res, next) => {
    console.log("🔍 ROTA DELETE /:id/cancel chamada para ID:", req.params.id);
    console.log("🔍 ROTA - Esta deveria chamar controller.cancel");
    controller.cancel(req, res, next);
});
console.log("✅ ROTA - DELETE /:id/cancel registrada");
// ROTAS GENÉRICAS POR ÚLTIMO
router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getById);
router.put("/:id", controller.updateAgendamento);
router.delete("/:id", (req, res, next) => {
    console.log("🔍 ROTA DELETE /:id chamada para ID:", req.params.id);
    console.log("🔍 ROTA - Esta deveria chamar controller.deleteAgendamento");
    controller.deleteAgendamento(req, res, next);
});
console.log("✅ ROTA - DELETE /:id registrada");
console.log("🔍 ROTAS - Todas as rotas de agendamentos foram registradas");
exports.default = router;
//# sourceMappingURL=agendamentoRoutes.js.map