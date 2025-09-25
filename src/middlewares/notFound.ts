// src/middlewares/notFound.ts
import { Request, Response } from 'express';

export default function notFound(req: Request, res: Response): void {
    res.status(404).json({
        error: "Rota não encontrada",
        path: req.originalUrl,
        method: req.method
    });
}