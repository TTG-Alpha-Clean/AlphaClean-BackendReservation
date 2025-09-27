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

export const getDailySlots = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        res.status(400).json({ error: "data (YYYY-MM-DD) é obrigatória" });
        return;
    }

    const result = await agendamentoService.getDailySlots({ data });
    res.json(result);
});

export const list = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

export const getById = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const ag = await agendamentoService.getByIdWithClientInfo(req.params.id, req.user!);
    if (!ag) {
        res.status(404).json({ error: "Agendamento não encontrado" });
        return;
    }
    res.json(ag);
});

export const create = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
        res.status(401).json({ error: "Não autenticado" });
        return;
    }

    const payload = assertCreatePayload(req.body);
    payload.usuario_id = req.user.id!; // Ensure usuario_id is always a string
    const created = await agendamentoService.create(payload);
    res.status(201).json(created);
});

export const updateAgendamento = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const payload = assertUpdatePayload(req.body);
    const updated = await agendamentoService.updateAgendamento(req.params.id, req.user!, payload);
    res.json(updated);
});

export const reschedule = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const data = assertReschedulePayload(req.body);
    const updated = await agendamentoService.reschedule(req.params.id, req.user!, data);
    res.json(updated);
});

export const updateStatus = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { status } = assertStatusPayload(req.body);
    const updated = await agendamentoService.updateStatus(req.params.id, req.user!, status);
    res.json(updated);
});

export const cancel = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log("🔍 CANCEL - Controller chamado para ID:", req.params.id);
    console.log("🔍 CANCEL - User:", { id: req.user!.id, role: req.user!.role });

    const updated = await agendamentoService.updateStatus(req.params.id, req.user!, "cancelado");
    console.log("🔍 CANCEL - Resultado:", updated);

    res.json(updated);
});

export const completeService = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log("🔍 COMPLETE - Controller chamado para ID:", req.params.id);
    console.log("🔍 COMPLETE - User:", { id: req.user!.id, role: req.user!.role });

    // Verificar se é admin
    if (req.user!.role !== 'admin') {
        res.status(403).json({ error: "Apenas administradores podem finalizar serviços" });
        return;
    }

    const { status = 'finalizado', notes, sendWhatsApp = false } = req.body;

    // Atualizar status do agendamento
    const updated = await agendamentoService.updateStatus(req.params.id, req.user!, status);

    // Se deve enviar WhatsApp, buscar dados completos e enviar notificação
    if (sendWhatsApp && status === 'finalizado') {
        try {
            // Buscar dados completos do agendamento com informações do cliente
            const agendamentoCompleto = await agendamentoService.getByIdWithClientInfo(req.params.id, req.user!);

            if (agendamentoCompleto?.usuario_telefone) {
                const whatsappClient = require('../services/whatsappClient').default;

                const enviado = await whatsappClient.sendServiceCompletedNotification(
                    agendamentoCompleto.usuario_nome || 'Cliente',
                    agendamentoCompleto.usuario_telefone,
                    agendamentoCompleto.servico_nome || 'Serviço',
                    agendamentoCompleto.modelo_veiculo,
                    agendamentoCompleto.placa
                );

                console.log("📱 WhatsApp enviado:", enviado);

                res.json({
                    ...updated,
                    whatsappSent: enviado,
                    message: enviado
                        ? "Serviço finalizado e notificação WhatsApp enviada com sucesso!"
                        : "Serviço finalizado, mas houve falha no envio do WhatsApp"
                });
                return;
            } else {
                console.log("⚠️ Cliente não possui telefone cadastrado");
                res.json({
                    ...updated,
                    whatsappSent: false,
                    message: "Serviço finalizado. Cliente não possui telefone cadastrado para WhatsApp."
                });
                return;
            }
        } catch (whatsappError) {
            console.error("❌ Erro ao enviar WhatsApp:", whatsappError);
            res.json({
                ...updated,
                whatsappSent: false,
                message: "Serviço finalizado, mas houve erro no envio do WhatsApp"
            });
            return;
        }
    }

    console.log("🔍 COMPLETE - Resultado:", updated);
    res.json(updated);
});

export const deleteAgendamento = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log("🔍 DELETE - Controller chamado para ID:", req.params.id);
    console.log("🔍 DELETE - User:", { id: req.user!.id, role: req.user!.role });

    const deleted = await agendamentoService.deleteAgendamento(req.params.id, req.user!);
    console.log("🔍 DELETE - Resultado:", deleted);

    res.json(deleted);
});