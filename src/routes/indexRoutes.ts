// src/routes/indexRoutes.ts
import { Router } from "express";
import userRoutes from "./userRoutes";
import agendamentosRoutes from "./agendamentoRoutes";
import authRoutes from "./authRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/agendamentos", agendamentosRoutes);

export default router;