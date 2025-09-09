// src/controllers/agendamentoController.ts - CORRIGIDO
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/interfaces';
import { asyncHandler, authenticatedHandler } from '../utils/asyncHandler';
import * as agendamentoService from '../services/agendamentoService';
import {
    assertCreatePayload,
    assertReschedulePayload,
    assertStatusPayload,
    assertUpdatePayload
} from '../utils/validators';

export const getDailySlots = asyncHandler(async (req: Request, res: Response) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        return res.status(400).json({ error: "data (YYYY-MM-DD) é obrigatória" });
    }

    const result = await agendamentoService.getDailySlots({ data });
    res.json(result);
});

export const list = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, data_ini, data_fim, usuario_id, page = "1", page_size = "20" } = req.query;
    const isAdmin = req.user?.role === "admin";

    const filter = {
        status: status as string,
        data_ini: data_ini as string,
        data_fim: data_fim as string,
        usuario_id: isAdmin ? (usuario_id as string) || null : req.user!.id,
        page: Number(page),
        page_size: Math.min(Number(page_size), 100),
        isAdmin,
    };

    const result = await agendamentoService.list(filter);
    res.json(result);
});

export const getById = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ag = await agendamentoService.getByIdWithClientInfo(req.params.id, req.user!);
    if (!ag) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
    }
    res.json(ag);
});

export const create = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: "Não autenticado" });
    }

    const payload = assertCreatePayload(req.body);
    payload.usuario_id = req.user.id!; // Ensure usuario_id is always a string
    const created = await agendamentoService.create(payload);
    res.status(201).json(created);
});

export const updateAgendamento = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = assertUpdatePayload(req.body);
    const updated = await agendamentoService.updateAgendamento(req.params.id, req.user!, payload);
    res.json(updated);
});

export const reschedule = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = assertReschedulePayload(req.body);
    const updated = await agendamentoService.reschedule(req.params.id, req.user!, data);
    res.json(updated);
});

export const updateStatus = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status } = assertStatusPayload(req.body);
    const updated = await agendamentoService.updateStatus(req.params.id, req.user!, status);
    res.json(updated);
});

export const cancel = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log("🔍 CANCEL - Controller chamado para ID:", req.params.id);
    console.log("🔍 CANCEL - User:", { id: req.user!.id, role: req.user!.role });

    const updated = await agendamentoService.updateStatus(req.params.id, req.user!, "cancelado");
    console.log("🔍 CANCEL - Resultado:", updated);

    res.json(updated);
});

export const deleteAgendamento = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log("🔍 DELETE - Controller chamado para ID:", req.params.id);
    console.log("🔍 DELETE - User:", { id: req.user!.id, role: req.user!.role });

    const deleted = await agendamentoService.deleteAgendamento(req.params.id, req.user!);
    console.log("🔍 DELETE - Resultado:", deleted);

    res.json(deleted);
});