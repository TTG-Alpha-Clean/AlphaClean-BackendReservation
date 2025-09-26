"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsappService_1 = __importDefault(require("../services/whatsappService"));
const router = (0, express_1.Router)();
/**
 * @route GET /api/whatsapp/status
 * @desc Verificar status da conexão WhatsApp
 * @access Private (Admin)
 */
router.get('/status', (req, res) => {
    try {
        const status = whatsappService_1.default.getConnectionStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        console.error('Erro ao verificar status WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar status do WhatsApp'
        });
    }
});
/**
 * @route POST /api/whatsapp/initialize
 * @desc Inicializar conexão WhatsApp
 * @access Private (Admin)
 */
router.post('/initialize', async (req, res) => {
    try {
        await whatsappService_1.default.initialize();
        res.json({
            success: true,
            message: 'WhatsApp inicializando... Aguarde o QR code no console do servidor.'
        });
    }
    catch (error) {
        console.error('Erro ao inicializar WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao inicializar WhatsApp'
        });
    }
});
/**
 * @route POST /api/whatsapp/send-test
 * @desc Enviar mensagem de teste
 * @access Private (Admin)
 */
router.post('/send-test', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({
                success: false,
                error: 'Número de telefone é obrigatório'
            });
            return;
        }
        const sent = await whatsappService_1.default.testMessage(phoneNumber);
        if (sent) {
            res.json({
                success: true,
                message: 'Mensagem de teste enviada com sucesso!'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Falha ao enviar mensagem de teste'
            });
        }
    }
    catch (error) {
        console.error('Erro ao enviar teste:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * @route POST /api/whatsapp/send-completion
 * @desc Enviar notificação de serviço finalizado
 * @access Private (usado internamente)
 */
router.post('/send-completion', async (req, res) => {
    try {
        const { clientName, clientPhone, serviceName } = req.body;
        if (!clientName || !clientPhone || !serviceName) {
            res.status(400).json({
                success: false,
                error: 'Nome do cliente, telefone e nome do serviço são obrigatórios'
            });
            return;
        }
        const sent = await whatsappService_1.default.sendServiceCompletedNotification(clientName, clientPhone, serviceName);
        if (sent) {
            res.json({
                success: true,
                message: 'Notificação de conclusão enviada com sucesso!'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Falha ao enviar notificação'
            });
        }
    }
    catch (error) {
        console.error('Erro ao enviar notificação de conclusão:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * @route POST /api/whatsapp/send-reminder
 * @desc Enviar lembrete de agendamento
 * @access Private (usado internamente)
 */
router.post('/send-reminder', async (req, res) => {
    try {
        const { clientName, clientPhone, serviceName, date, time } = req.body;
        if (!clientName || !clientPhone || !serviceName || !date || !time) {
            res.status(400).json({
                success: false,
                error: 'Todos os campos são obrigatórios'
            });
            return;
        }
        const sent = await whatsappService_1.default.sendReminderNotification(clientName, clientPhone, serviceName, date, time);
        if (sent) {
            res.json({
                success: true,
                message: 'Lembrete enviado com sucesso!'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Falha ao enviar lembrete'
            });
        }
    }
    catch (error) {
        console.error('Erro ao enviar lembrete:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * @route POST /api/whatsapp/disconnect
 * @desc Desconectar WhatsApp
 * @access Private (Admin)
 */
router.post('/disconnect', async (req, res) => {
    try {
        await whatsappService_1.default.disconnect();
        res.json({
            success: true,
            message: 'WhatsApp desconectado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao desconectar WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao desconectar WhatsApp'
        });
    }
});
exports.default = router;
//# sourceMappingURL=whatsapp.js.map