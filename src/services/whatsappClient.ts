// WhatsApp Client para comunicação com serviço separado
class WhatsAppClient {
  private whatsappServiceUrl: string;

  constructor() {
    // URL do serviço WhatsApp (para produção será do Render)
    this.whatsappServiceUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3002';
  }

  private isWhatsAppServiceAvailable(): boolean {
    // Verifica se o serviço WhatsApp está configurado
    // Em produção, retorna false se não houver URL configurada
    return !!process.env.WHATSAPP_SERVICE_URL || process.env.NODE_ENV === 'development';
  }

  async sendServiceCompletedNotification(
    clientName: string,
    clientPhone: string,
    serviceName: string,
    vehicleModel?: string,
    licensePlate?: string
  ): Promise<boolean> {
    // Verificar se o serviço WhatsApp está disponível
    if (!this.isWhatsAppServiceAvailable()) {
      console.log('ℹ️ WhatsApp service não disponível em produção - notificação ignorada');
      return true; // Retorna true para não bloquear o fluxo
    }

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

      return (result as { success?: boolean }).success || false;
    } catch (error) {
      console.error('❌ Erro ao comunicar com WhatsApp Service:', error);
      return false;
    }
  }

  async sendReminderNotification(
    clientName: string,
    clientPhone: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<boolean> {
    // Verificar se o serviço WhatsApp está disponível
    if (!this.isWhatsAppServiceAvailable()) {
      console.log('ℹ️ WhatsApp service não disponível em produção - lembrete ignorado');
      return true; // Retorna true para não bloquear o fluxo
    }

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

      return (result as { success?: boolean }).success || false;
    } catch (error) {
      console.error('❌ Erro ao comunicar com WhatsApp Service:', error);
      return false;
    }
  }

  async testMessage(phoneNumber: string): Promise<boolean> {
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

      return (result as { success?: boolean }).success || false;
    } catch (error) {
      console.error('❌ Erro ao comunicar com WhatsApp Service:', error);
      return false;
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        return {
          connected: false,
          message: 'Erro ao conectar com WhatsApp Service'
        };
      }

      const result = await response.json() as { connected?: boolean; message?: string };
      return {
        connected: result.connected || false,
        message: result.message || 'Status desconhecido'
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status do WhatsApp Service:', error);
      return {
        connected: false,
        message: 'WhatsApp Service indisponível'
      };
    }
  }

  async connect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000) // 15s timeout
      });

      if (response.ok) {
        const result = await response.json() as { message?: string };
        console.log('✅ WhatsApp Service response:', result.message);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao conectar WhatsApp Service:', error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Erro ao desconectar WhatsApp Service:', error);
      return false;
    }
  }

  async getQRCode(): Promise<{ success: boolean; qrCode: string | null; message: string }> {
    try {
      const response = await fetch(`${this.whatsappServiceUrl}/whatsapp/qr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return {
          success: false,
          qrCode: null,
          message: 'Erro ao obter QR Code do WhatsApp Service'
        };
      }

      const result = await response.json() as { success?: boolean; qrCode?: string; message?: string };
      return {
        success: result.success || false,
        qrCode: result.qrCode || null,
        message: result.message || 'QR Code não disponível'
      };
    } catch (error) {
      console.error('❌ Erro ao obter QR Code:', error);
      return {
        success: false,
        qrCode: null,
        message: 'WhatsApp Service indisponível'
      };
    }
  }
}

// Singleton pattern
const whatsappClient = new WhatsAppClient();

export default whatsappClient;