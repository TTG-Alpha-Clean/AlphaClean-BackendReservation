// src/routes/reports.ts
import { Router } from "express";
import * as reportController from "../controllers/reportController";
import { requireUser, requireAdmin } from "../middlewares/auth";

const router = Router();

// Todas as rotas de relatórios requerem autenticação e permissão de admin
router.use(requireUser);
router.use(requireAdmin);

// GET /api/reports/monthly-revenue?year=2025 - Receita mensal do ano
router.get("/monthly-revenue", reportController.getMonthlyRevenue);

// GET /api/reports/top-services?year=2025 - Serviços mais rentáveis
router.get("/top-services", reportController.getTopServices);

// GET /api/reports/top-clients?year=2025&limit=10 - Clientes mais assíduos
router.get("/top-clients", reportController.getTopClients);

// GET /api/reports/stats?year=2025 - Estatísticas gerais
router.get("/stats", reportController.getGeneralStats);

export default router;
