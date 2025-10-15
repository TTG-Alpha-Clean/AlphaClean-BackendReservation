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
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/carRoutes.ts
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const carController = __importStar(require("../controllers/carController"));
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.requireUser);
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
exports.default = router;
//# sourceMappingURL=carRoutes.js.map