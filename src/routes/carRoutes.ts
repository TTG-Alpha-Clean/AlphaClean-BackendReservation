// src/routes/carRoutes.ts
import { Router } from "express";
import { requireUser } from "../middlewares/auth";
import * as carController from "../controllers/carController";

const router = Router();

// Todas as rotas requerem autenticação
router.use(requireUser);

// GET /api/cars - Listar carros do usuário
router.get("/", carController.listCars);

// GET /api/cars/default - Obter carro padrão do usuário
router.get("/default", carController.getDefaultCar);

// POST /api/cars - Criar novo carro
router.post("/", carController.createCar);

// GET /api/cars/:id - Obter carro por ID
router.get("/:id", carController.getCarById);

// PUT /api/cars/:id - Atualizar carro
router.put("/:id", carController.updateCar);

// DELETE /api/cars/:id - Excluir carro (soft delete)
router.delete("/:id", carController.deleteCar);

// PUT /api/cars/:id/default - Definir como carro padrão
router.put("/:id/default", carController.setDefaultCar);

export default router;