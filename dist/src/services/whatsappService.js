"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path_1 = __importDefault(require("path"));
class WhatsAppService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.isReady = false;
        this.qrCodeGenerated = null;
    }
    async initialize() {
        console.log('🔄 Inicializando serviço WhatsApp...');
        try {
            // Criar cliente WhatsApp com autenticação local
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: path_1.default.join(__dirname, '../.wwebjs_auth')
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });
            // Evento QR Code
            this.client.on('qr', (qr) => {
                this.qrCodeGenerated = qr;
                console.log('📱 QR Code para conectar WhatsApp:');
                qrcode.generate(qr, { small: true });
                console.log('👆 Escaneie o QR code acima com seu WhatsApp');
            });
            // Evento de conexão pronta
            this.client.on('ready', () => {
                console.log('✅ WhatsApp conectado com sucesso!');
                this.isConnected = true;
                this.isReady = true;
            });
            // Evento de autenticação bem-sucedida
            this.client.on('authenticated', () => {
                console.log('🔐 WhatsApp autenticado com sucesso!');
                this.isConnected = true;
            });
            // Evento de falha de autenticação
            this.client.on('auth_failure', (msg) => {
                console.error('❌ Falha na autenticação WhatsApp:', msg);
                this.isConnected = false;
                this.isReady = false;
            });
            // Evento de desconexão
            this.client.on('disconnected', (reason) => {
                console.log('❌ WhatsApp desconectado:', reason);
                this.isConnected = false;
                this.isReady = false;
            });
            // Evento de mensagem recebida (opcional - para logs)
            this.client.on('message', (message) => {
                console.log('📩 Mensagem recebida de:', message.from);
            });
            // Inicializar cliente
            await this.client.initialize();
        }
        catch (error) {
            console.error('❌ Erro ao inicializar WhatsApp:', error);
            throw error;
        }
    }
    async sendMessage(phoneNumber, message) {
        if (!this.isReady || !this.client) {
            console.log('❌ WhatsApp não está pronto para envio');
            return false;
        }
        try {
            // Formatar número para padrão WhatsApp
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            console.log(`📤 Enviando mensagem para ${formattedNumber}: ${message}`);
            // Enviar mensagem
            await this.client.sendMessage(formattedNumber, message);
            console.log('✅ Mensagem enviada com sucesso!');
            return true;
        }
        catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            return false;
        }
    }
    formatPhoneNumber(phone) {
        // Remove todos os caracteres não numéricos
        let cleanPhone = phone.replace(/\D/g, '');
        // Se não começar com 55 (Brasil), adiciona
        if (!cleanPhone.startsWith('55')) {
            cleanPhone = '55' + cleanPhone;
        }
        // Adiciona @c.us (formato whatsapp-web.js)
        return cleanPhone + '@c.us';
    }
    async sendServiceCompletedNotification(clientName, clientPhone, serviceName) {
        const message = `🎉 *Alpha Clean - Serviço Concluído!*

Olá, ${clientName}! 👋

Temos o prazer de informar que seu serviço foi finalizado com sucesso! ✨

📋 *Serviço realizado:* ${serviceName}
✅ *Status:* Concluído
📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}

Agradecemos pela confiança em nossos serviços! Esperamos que você esteja satisfeito(a) com o resultado.

Se tiver alguma dúvida ou feedback, não hesite em entrar em contato conosco.

*Alpha Clean - Cuidado profissional para seu veículo* 🚗💙`;
        return await this.sendMessage(clientPhone, message);
    }
    async sendReminderNotification(clientName, clientPhone, serviceName, date, time) {
        const message = `⏰ *Alpha Clean - Lembrete de Agendamento*

Olá, ${clientName}! 👋

Este é um lembrete sobre seu agendamento:

📋 *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Estamos ansiosos para atendê-lo(a)!

Se precisar reagendar ou tiver alguma dúvida, entre em contato conosco.

*Alpha Clean - Cuidado profissional para seu veículo* 🚗💙`;
        return await this.sendMessage(clientPhone, message);
    }
    getConnectionStatus() {
        if (this.isReady) {
            return {
                connected: true,
                message: 'WhatsApp conectado e pronto para uso'
            };
        }
        else if (this.isConnected) {
            return {
                connected: false,
                message: 'WhatsApp conectado, mas ainda não está pronto'
            };
        }
        else if (this.qrCodeGenerated) {
            return {
                connected: false,
                message: 'QR Code gerado. Escaneie para conectar.'
            };
        }
        else {
            return {
                connected: false,
                message: 'WhatsApp não está conectado. Clique em "Conectar WhatsApp".'
            };
        }
    }
    async disconnect() {
        if (this.client) {
            console.log('🔌 Desconectando WhatsApp...');
            await this.client.destroy();
            this.client = null;
            this.isConnected = false;
            this.isReady = false;
            this.qrCodeGenerated = null;
        }
    }
    // Método para testar envio de mensagem
    async testMessage(phoneNumber) {
        const testMessage = `🧪 *Teste de Conexão - Alpha Clean*

Esta é uma mensagem de teste para verificar se o sistema de notificações WhatsApp está funcionando corretamente.

✅ Sistema operacional
📱 Mensagens ativas

*Alpha Clean - Cuidado profissional para seu veículo* 🚗`;
        return await this.sendMessage(phoneNumber, testMessage);
    }
    // Método para obter o QR code atual (para exibir na interface)
    getCurrentQRCode() {
        return this.qrCodeGenerated;
    }
}
// Singleton pattern
const whatsappService = new WhatsAppService();
exports.default = whatsappService;
//# sourceMappingURL=whatsappService.js.map