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
router.patch("/:id/reagendar", ctrl.reschedule);
router.patch("/:id/status", ctrl.updateStatus);
router.delete("/:id", ctrl.cancel);

export default router;
