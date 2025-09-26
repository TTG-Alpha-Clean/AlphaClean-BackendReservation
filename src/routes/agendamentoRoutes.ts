// src/routes/agendamentoRoutes.ts
import express from "express";
import { requireUser, requireAdmin } from "../middlewares/auth";
import * as controller from "../controllers/agendamentoController";

const router = express.Router();

// Log para verificar se as rotas estão sendo carregadas
console.log("🔍 ROTAS - Carregando rotas de agendamentos...");

// Rotas públicas (slots disponíveis)
router.get("/slots", controller.getDailySlots);
console.log("✅ ROTA - GET /slots registrada");

// Middleware de autenticação para todas as rotas abaixo
router.use(requireUser);

// ROTAS ESPECÍFICAS PRIMEIRO
router.patch("/:id/reschedule", (req, res, next) => {
    console.log("🔍 ROTA PATCH /:id/reschedule chamada para ID:", req.params.id);
    controller.reschedule(req, res, next);
});

router.patch("/:id/status", (req, res, next) => {
    console.log("🔍 ROTA PATCH /:id/status chamada para ID:", req.params.id);
    controller.updateStatus(req, res, next);
});

router.patch("/:id/complete", (req, res, next) => {
    console.log("🔍 ROTA PATCH /:id/complete chamada para ID:", req.params.id);
    controller.completeService(req, res, next);
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

export default router;