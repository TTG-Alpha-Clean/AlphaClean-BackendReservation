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
exports.getDefaultCar = exports.setDefaultCar = exports.deleteCar = exports.updateCar = exports.createCar = exports.getCarById = exports.listCars = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const carService = __importStar(require("../services/carService"));
exports.listCars = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const { page, page_size, ativo, marca } = req.query;
    const filters = {
        page: page ? Number(page) : 1,
        page_size: page_size ? Math.min(Number(page_size), 100) : 20,
        ativo: ativo === undefined ? true : (ativo === "true"),
        marca: marca
    };
    const result = await carService.listUserCars(req.user.id, filters);
    res.json(result);
});
exports.getCarById = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const car = await carService.getCarById(req.params.id, req.user.id);
    if (!car) {
        res.status(404).json({ error: "Carro não encontrado" });
        return;
    }
    res.json(car);
});
exports.createCar = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const car = await carService.createCar(req.user.id, req.body);
    res.status(201).json(car);
});
exports.updateCar = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const car = await carService.updateCar(req.params.id, req.user.id, req.body);
    res.json(car);
});
exports.deleteCar = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    await carService.deleteCar(req.params.id, req.user.id);
    res.status(204).send();
});
exports.setDefaultCar = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const car = await carService.setDefaultCar(req.params.id, req.user.id);
    res.json(car);
});
exports.getDefaultCar = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const car = await carService.getDefaultCar(req.user.id);
    if (!car) {
        res.status(404).json({ error: "Nenhum carro padrão configurado" });
        return;
    }
    res.json(car);
});
//# sourceMappingURL=carController.js.map