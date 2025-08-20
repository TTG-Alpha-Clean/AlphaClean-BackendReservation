// src/routes/agendamentoRoutes.js
import { Router } from "express";
import { requireUser } from "../middlewares/auth.js";
import * as ctrl from "../controllers/agendamentoController.js";

const router = Router();

// todas as rotas exigem usuário autenticado
router.use(requireUser);

// slots do dia
router.get("/slots", ctrl.getDailySlots);

// CRUD e ações
router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);

// ✅ NOVA ROTA: Edição completa do agendamento
router.put("/:id", ctrl.updateAgendamento);

// ✅ MANTIDA: Reagendamento (só data/horário) 
router.patch("/:id/reagendar", ctrl.reschedule);

// Outras ações
router.patch("/:id/status", ctrl.updateStatus);
router.delete("/:id", ctrl.cancel);

export default router;