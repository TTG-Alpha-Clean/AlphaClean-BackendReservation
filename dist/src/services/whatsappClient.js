"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// WhatsApp Client para comunicação com serviço separado
class WhatsAppClient {
    constructor() {
        // URL do serviço WhatsApp (para produção será do Render)
        this.whatsappServiceUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3002';
    }
    async sendServiceCompletedNotification(clientName, clientPhone, serviceName, vehicleModel, licensePlate) {
        try {
            console.log('📤 Enviando notificação de conclusão via WhatsApp Service...');
            const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/send-completion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientName,
                    clientPhone,
                    serviceName,
                    vehicleModel,
                    licensePlate
                })
            });
            if (!response.ok) {
                const error = await response.text();
                console.error('❌ Erro na resposta do WhatsApp Service:', error);
                return false;
            }
            const result = await response.json();
            console.log('✅ Resposta do WhatsApp Service:', result);
            return result.success || false;
        }
        catch (error) {
            console.error('❌ Erro ao comunicar com WhatsApp Service:', error);
            return false;
        }
    }
    async sendReminderNotification(clientName, clientPhone, serviceName, date, time) {
        try {
            console.log('📤 Enviando lembrete via WhatsApp Service...');
            const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/send-reminder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientName,
                    clientPhone,
                    serviceName,
                    date,
                    time
                })
            });
            if (!response.ok) {
                const error = await response.text();
                console.error('❌ Erro na resposta do WhatsApp Service:', error);
                return false;
            }
            const result = await response.json();
            console.log('✅ Resposta do WhatsApp Service:', result);
            return result.success || false;
        }
        catch (error) {
            console.error('❌ Erro ao comunicar com WhatsApp Service:', error);
            return false;
        }
    }
    async testMessage(phoneNumber) {
        try {
            console.log('📤 Enviando mensagem de teste via WhatsApp Service...');
            const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber
                })
            });
            if (!response.ok) {
                const error = await response.text();
                console.error('❌ Erro na resposta do WhatsApp Service:', error);
                return false;
            }
            const result = await response.json();
            console.log('✅ Resposta do WhatsApp Service:', result);
            return result.success || false;
        }
        catch (error) {
            console.error('❌ Erro ao comunicar com WhatsApp Service:', error);
            return false;
        }
    }
    async getConnectionStatus() {
        try {
            const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/status`);
            if (!response.ok) {
                return {
                    connected: false,
                    message: 'Erro ao conectar com WhatsApp Service'
                };
            }
            const result = await response.json();
            return result;
        }
        catch (error) {
            console.error('❌ Erro ao verificar status do WhatsApp Service:', error);
            return {
                connected: false,
                message: 'WhatsApp Service indisponível'
            };
        }
    }
    async connect() {
        try {
            const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/connect`, {
                method: 'POST'
            });
            return response.ok;
        }
        catch (error) {
            console.error('❌ Erro ao conectar WhatsApp Service:', error);
            return false;
        }
    }
    async disconnect() {
        try {
            const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/disconnect`, {
                method: 'POST'
            });
            return response.ok;
        }
        catch (error) {
            console.error('❌ Erro ao desconectar WhatsApp Service:', error);
            return false;
        }
    }
}
// Singleton pattern
const whatsappClient = new WhatsAppClient();
exports.default = whatsappClient;
//# sourceMappingURL=whatsappClient.js.map