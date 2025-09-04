// src/controllers/agendamentoController.js - COM ROTA DELETE

import asyncHandler from "../utils/asyncHandler.js";
import * as svc from "../services/agendamentoService.js";
import { assertCreatePayload, assertReschedulePayload, assertStatusPayload, assertUpdatePayload } from "../utils/validators.js";

export const getDailySlots = asyncHandler(async (req, res) => {
    const { data } = req.query;
    if (!data) return res.status(400).json({ error: "data (YYYY-MM-DD) é obrigatória" });
    const result = await svc.getDailySlots({ data });
    res.json(result);
});

export const list = asyncHandler(async (req, res) => {
    const { status, data_ini, data_fim, usuario_id, page = 1, page_size = 20 } = req.query;
    const isAdmin = req.user.role === "admin";

    const filter = {
        status,
        data_ini,
        data_fim,
        usuario_id: isAdmin ? usuario_id || null : req.user.id,
        page: Number(page),
        page_size: Math.min(Number(page_size), 100),
        isAdmin,
    };

    const result = await svc.list(filter);
    res.json(result);
});

export const getById = asyncHandler(async (req, res) => {
    const ag = await svc.getByIdWithClientInfo(req.params.id, req.user);
    if (!ag) return res.status(404).json({ error: "Agendamento não encontrado" });
    res.json(ag);
});

export const create = asyncHandler(async (req, res) => {
    if (!req.user?.id) return res.status(401).json({ error: "Não autenticado" });

    const payload = assertCreatePayload(req.body);
    payload.usuario_id = req.user.id;
    const created = await svc.create(payload);
    res.status(201).json(created);
});

export const updateAgendamento = asyncHandler(async (req, res) => {
    const payload = assertUpdatePayload(req.body);
    const updated = await svc.updateAgendamento(req.params.id, req.user, payload);
    res.json(updated);
});

export const reschedule = asyncHandler(async (req, res) => {
    const data = assertReschedulePayload(req.body);
    const updated = await svc.reschedule(req.params.id, req.user, data);
    res.json(updated);
});

export const updateStatus = asyncHandler(async (req, res) => {
    const { status } = assertStatusPayload(req.body);
    const updated = await svc.updateStatus(req.params.id, req.user, status);
    res.json(updated);
});

export const cancel = asyncHandler(async (req, res) => {
    console.log("🔍 CANCEL - Controller chamado para ID:", req.params.id);
    console.log("🔍 CANCEL - User:", { id: req.user.id, role: req.user.role });

    // IMPORTANTE: Esta função deve chamar updateStatus, NÃO deleteAgendamento
    const updated = await svc.updateStatus(req.params.id, req.user, "cancelado");
    console.log("🔍 CANCEL - Resultado:", updated);

    res.json(updated);
});

// ✅ ROTA DELETE: Exclusão permanente de agendamentos  
export const deleteAgendamento = asyncHandler(async (req, res) => {
    console.log("🔍 DELETE - Controller chamado para ID:", req.params.id);
    console.log("🔍 DELETE - User:", { id: req.user.id, role: req.user.role });

    const deleted = await svc.deleteAgendamento(req.params.id, req.user);
    console.log("🔍 DELETE - Resultado:", deleted);

    res.json(deleted);
});