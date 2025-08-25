// src/controllers/servicoController.js
import asyncHandler from "../utils/asyncHandler.js";
import * as servicoSvc from "../services/servicoService.js";

export const listServicos = asyncHandler(async (req, res) => {
    const { ativo } = req.query;
    const incluirInativos = ativo === "false" || ativo === "all";

    const servicos = await servicoSvc.listServicos({
        ativo: incluirInativos ? undefined : true
    });

    res.json({ data: servicos });
});

export const getServico = asyncHandler(async (req, res) => {
    const servico = await servicoSvc.getServicoById(req.params.id);
    if (!servico) {
        return res.status(404).json({ error: "Serviço não encontrado" });
    }
    res.json(servico);
});

export const createServico = asyncHandler(async (req, res) => {
    const { nome, valor } = req.body;

    if (!nome || valor === undefined) {
        return res.status(400).json({ error: "Nome e valor são obrigatórios" });
    }

    const servico = await servicoSvc.createServico({ nome, valor });
    res.status(201).json(servico);
});

export const updateServico = asyncHandler(async (req, res) => {
    const { nome, valor, ativo } = req.body;
    const servico = await servicoSvc.updateServico(req.params.id, { nome, valor, ativo });
    res.json(servico);
});

export const deleteServico = asyncHandler(async (req, res) => {
    const result = await servicoSvc.deleteServico(req.params.id);
    res.json(result);
});