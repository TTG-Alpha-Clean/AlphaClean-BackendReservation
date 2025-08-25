// src/routes/servicoRoutes.js
import { Router } from "express";
import * as servicoController from "../controllers/servicoController.js";
import { requireUser, requireAdmin } from "../middlewares/auth.js";

const router = Router();

// Rotas públicas (para clientes verem serviços disponíveis)
router.get("/", servicoController.listServicos);

// Rotas administrativas (apenas admin)
router.post("/", requireUser, requireAdmin, servicoController.createServico);
router.get("/:id", requireUser, requireAdmin, servicoController.getServico);
router.put("/:id", requireUser, requireAdmin, servicoController.updateServico);
router.delete("/:id", requireUser, requireAdmin, servicoController.deleteServico);

export default router;