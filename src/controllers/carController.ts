// src/controllers/carController.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/interfaces';
import { authenticatedHandler } from '../utils/asyncHandler';
import * as carService from '../services/carService';

export const listCars = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, page_size, ativo, marca } = req.query;

    const filters = {
        page: page ? Number(page) : 1,
        page_size: page_size ? Math.min(Number(page_size), 100) : 20,
        ativo: ativo === undefined ? true : (ativo === "true"),
        marca: marca as string
    };

    const result = await carService.listUserCars(req.user!.id, filters);
    res.json(result);
});

export const getCarById = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const car = await carService.getCarById(req.params.id, req.user!.id);

    if (!car) {
        res.status(404).json({ error: "Carro não encontrado" });
        return;
    }

    res.json(car);
});

export const createCar = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const car = await carService.createCar(req.user!.id, req.body);
    res.status(201).json(car);
});

export const updateCar = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const car = await carService.updateCar(req.params.id, req.user!.id, req.body);
    res.json(car);
});

export const deleteCar = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    await carService.deleteCar(req.params.id, req.user!.id);
    res.status(204).send();
});

export const setDefaultCar = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const car = await carService.setDefaultCar(req.params.id, req.user!.id);
    res.json(car);
});

export const getDefaultCar = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const car = await carService.getDefaultCar(req.user!.id);

    if (!car) {
        res.status(404).json({ error: "Nenhum carro padrão configurado" });
        return;
    }

    res.json(car);
});