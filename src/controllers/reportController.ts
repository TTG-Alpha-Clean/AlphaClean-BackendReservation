// src/controllers/reportController.ts
import { Request, Response } from "express";
import * as reportService from "../services/reportService";
import ApiError from "../utils/apiError";

export async function getMonthlyRevenue(req: Request, res: Response): Promise<void> {
    try {
        const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

        if (isNaN(year) || year < 2000 || year > 2100) {
            throw new ApiError(400, "Ano inválido");
        }

        const data = await reportService.getMonthlyRevenue(year);

        res.json({
            success: true,
            year,
            data
        });
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error("Erro ao buscar receita mensal:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar receita mensal"
            });
        }
    }
}

export async function getTopServices(req: Request, res: Response): Promise<void> {
    try {
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;

        if (year && (isNaN(year) || year < 2000 || year > 2100)) {
            throw new ApiError(400, "Ano inválido");
        }

        const data = await reportService.getTopServices(year);

        res.json({
            success: true,
            year: year || 'todos',
            data
        });
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error("Erro ao buscar top serviços:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar top serviços"
            });
        }
    }
}

export async function getTopClients(req: Request, res: Response): Promise<void> {
    try {
        const year = req.query.year ? parseInt(req.query.year as string) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        if (year && (isNaN(year) || year < 2000 || year > 2100)) {
            throw new ApiError(400, "Ano inválido");
        }

        if (isNaN(limit) || limit < 1 || limit > 100) {
            throw new ApiError(400, "Limite inválido (1-100)");
        }

        const data = await reportService.getTopClients(year, limit);

        res.json({
            success: true,
            year: year || 'todos',
            data
        });
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error("Erro ao buscar top clientes:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar top clientes"
            });
        }
    }
}

export async function getGeneralStats(req: Request, res: Response): Promise<void> {
    try {
        const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

        if (isNaN(year) || year < 2000 || year > 2100) {
            throw new ApiError(400, "Ano inválido");
        }

        const data = await reportService.getGeneralStats(year);

        res.json({
            success: true,
            year,
            data
        });
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        } else {
            console.error("Erro ao buscar estatísticas gerais:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar estatísticas gerais"
            });
        }
    }
}
