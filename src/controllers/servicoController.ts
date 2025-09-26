// src/controllers/servicoController.ts
import { Request, Response, NextFunction } from 'express';
import * as servicoSvc from "../services/servicoService";

// Helper para async handlers
const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export const listServicos = asyncHandler(async (req: Request, res: Response) => {
    const { ativo } = req.query;
    const incluirInativos = ativo === "false" || ativo === "all";

    const servicos = await servicoSvc.listServicos({
        ativo: incluirInativos ? undefined : true
    });

    res.json({ data: servicos });
});

export const getServico = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const servico = await servicoSvc.getServicoById(req.params.id);
    if (!servico) {
        res.status(404).json({ error: "Serviço não encontrado" });
        return;
    }
    res.json(servico);
});

export const createServico = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { nome, valor } = req.body;

    if (!nome || valor === undefined) {
        res.status(400).json({ error: "Nome e valor são obrigatórios" });
        return;
    }

    const servico = await servicoSvc.createServico({ nome, valor });
    res.status(201).json(servico);
});

export const updateServico = asyncHandler(async (req: Request, res: Response) => {
    const { nome, valor, ativo } = req.body;
    const servico = await servicoSvc.updateServico(req.params.id, { nome, valor, ativo });
    res.json(servico);
});

export const deleteServico = asyncHandler(async (req: Request, res: Response) => {
    const result = await servicoSvc.deleteServico(req.params.id);
    res.json(result);
});