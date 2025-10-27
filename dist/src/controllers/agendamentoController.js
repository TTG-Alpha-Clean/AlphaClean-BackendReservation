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
exports.deleteAgendamento = exports.completeService = exports.cancel = exports.updateStatus = exports.reschedule = exports.updateAgendamento = exports.create = exports.getById = exports.list = exports.getDailySlots = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const agendamentoService = __importStar(require("../services/agendamentoService"));
const validators_1 = require("../utils/validators");
exports.getDailySlots = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { data } = req.query;
    if (!data || typeof data !== 'string') {
        res.status(400).json({ error: "data (YYYY-MM-DD) é obrigatória" });
        return;
    }
    const result = await agendamentoService.getDailySlots({ data });
    res.json(result);
});
exports.list = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const { status, data_ini, data_fim, usuario_id, page = "1", page_size = "20" } = req.query;
    const isAdmin = req.user?.role === "admin";
    const filter = {
        status: status,
        data_ini: data_ini,
        data_fim: data_fim,
        usuario_id: isAdmin ? usuario_id || null : req.user.id,
        page: Number(page),
        page_size: Math.min(Number(page_size), 100),
        isAdmin,
    };
    const result = await agendamentoService.list(filter);
    res.json(result);
});
exports.getById = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const ag = await agendamentoService.getByIdWithClientInfo(req.params.id, req.user);
    if (!ag) {
        res.status(404).json({ error: "Agendamento não encontrado" });
        return;
    }
    res.json(ag);
});
exports.create = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ error: "Não autenticado" });
        return;
    }
    const payload = (0, validators_1.assertCreatePayload)(req.body);
    payload.usuario_id = req.user.id; // Ensure usuario_id is always a string
    const created = await agendamentoService.create(payload);
    res.status(201).json(created);
});
exports.updateAgendamento = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const payload = (0, validators_1.assertUpdatePayload)(req.body);
    const updated = await agendamentoService.updateAgendamento(req.params.id, req.user, payload);
    res.json(updated);
});
exports.reschedule = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const data = (0, validators_1.assertReschedulePayload)(req.body);
    const updated = await agendamentoService.reschedule(req.params.id, req.user, data);
    res.json(updated);
});
exports.updateStatus = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const { status } = (0, validators_1.assertStatusPayload)(req.body);
    const updated = await agendamentoService.updateStatus(req.params.id, req.user, status);
    res.json(updated);
});
exports.cancel = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    console.log("🔍 CANCEL - Controller chamado para ID:", req.params.id);
    console.log("🔍 CANCEL - User:", { id: req.user.id, role: req.user.role });
    const updated = await agendamentoService.updateStatus(req.params.id, req.user, "cancelado");
    console.log("🔍 CANCEL - Resultado:", updated);
    res.json(updated);
});
exports.completeService = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    console.log("🔍 COMPLETE - Controller chamado para ID:", req.params.id);
    console.log("🔍 COMPLETE - User:", { id: req.user.id, role: req.user.role });
    // Verificar se é admin
    if (req.user.role !== 'admin') {
        res.status(403).json({ error: "Apenas administradores podem finalizar serviços" });
        return;
    }
    const { status = 'finalizado', notes, sendWhatsApp = false } = req.body;
    // Atualizar status do agendamento IMEDIATAMENTE
    const updated = await agendamentoService.updateStatus(req.params.id, req.user, status);
    console.log("🔍 COMPLETE - Serviço finalizado:", updated);
    // Se deve enviar WhatsApp, AGUARDAR o envio para retornar status
    if (sendWhatsApp && status === 'finalizado') {
        console.log("🔔 Tentando enviar notificação WhatsApp - sendWhatsApp:", sendWhatsApp);
        try {
            console.log("📋 Buscando dados completos do agendamento ID:", req.params.id);
            // Buscar dados completos do agendamento com informações do cliente
            const agendamentoCompleto = await agendamentoService.getByIdWithClientInfo(req.params.id, req.user);
            console.log("📊 Dados do agendamento:", {
                nome: agendamentoCompleto?.usuario_nome,
                telefone: agendamentoCompleto?.usuario_telefone,
                servico: agendamentoCompleto?.servico_nome,
                veiculo: agendamentoCompleto?.modelo_veiculo,
                placa: agendamentoCompleto?.placa
            });
            if (!agendamentoCompleto?.usuario_telefone) {
                console.log("⚠️ Cliente não possui telefone cadastrado");
                res.json({
                    ...updated,
                    whatsappSent: false,
                    whatsappError: "Cliente não possui telefone cadastrado",
                    message: "Serviço finalizado, mas cliente não possui telefone para WhatsApp"
                });
                return;
            }
            console.log("📞 Telefone encontrado, importando whatsappClient...");
            const whatsappClient = require('../services/whatsappClient').default;
            console.log("📤 Chamando sendServiceCompletedNotification...");
            const enviado = await whatsappClient.sendServiceCompletedNotification(agendamentoCompleto.usuario_nome || 'Cliente', agendamentoCompleto.usuario_telefone, agendamentoCompleto.servico_nome || 'Serviço', agendamentoCompleto.modelo_veiculo, agendamentoCompleto.placa);
            console.log("📱 WhatsApp enviado:", enviado);
            res.json({
                ...updated,
                whatsappSent: enviado,
                message: enviado
                    ? "Serviço finalizado e notificação WhatsApp enviada!"
                    : "Serviço finalizado, mas houve erro no envio do WhatsApp"
            });
        }
        catch (whatsappError) {
            console.error("❌ Erro ao enviar WhatsApp:", whatsappError);
            console.error("❌ Stack trace:", whatsappError.stack);
            res.json({
                ...updated,
                whatsappSent: false,
                whatsappError: whatsappError.message,
                message: "Serviço finalizado, mas houve erro no envio do WhatsApp"
            });
        }
    }
    else {
        console.log("ℹ️ Notificação WhatsApp não será enviada - sendWhatsApp:", sendWhatsApp, "status:", status);
        res.json({
            ...updated,
            message: "Serviço finalizado com sucesso!"
        });
    }
});
exports.deleteAgendamento = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    console.log("🔍 DELETE - Controller chamado para ID:", req.params.id);
    console.log("🔍 DELETE - User:", { id: req.user.id, role: req.user.role });
    const deleted = await agendamentoService.deleteAgendamento(req.params.id, req.user);
    console.log("🔍 DELETE - Resultado:", deleted);
    res.json(deleted);
});
//# sourceMappingURL=agendamentoController.js.map