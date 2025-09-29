// src/routes/indexRoutes.ts
import { Router } from "express";
import userRoutes from "./userRoutes";
import agendamentosRoutes from "./agendamentoRoutes";
import authRoutes from "./authRoutes";
import carRoutes from "./carRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/agendamentos", agendamentosRoutes);
router.use("/cars", carRoutes);

export default router;