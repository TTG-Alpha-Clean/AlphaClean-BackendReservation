import { Router } from 'express';
import whatsappClient from '../services/whatsappClient';

const router = Router();

/**
 * @route GET /api/whatsapp/status
 * @desc Verificar status da conexão WhatsApp
 * @access Private (Admin)
 */
router.get('/status', async (req, res) => {
  try {
    const status = await whatsappClient.getConnectionStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Erro ao verificar status WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status do WhatsApp'
    });
  }
});

/**
 * @route GET /api/whatsapp/qr
 * @desc Obter QR code para conexão WhatsApp
 * @access Private (Admin)
 */
router.get('/qr', async (req, res) => {
  try {
    const qrResult = await whatsappClient.getQRCode();
    res.json({
      success: qrResult.success,
      qrCode: qrResult.qrCode,
      message: qrResult.message
    });
  } catch (error) {
    console.error('Erro ao obter QR code:', error);
    res.status(500).json({
      success: false,
      qrCode: null,
      message: 'Erro ao obter QR code'
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
    const success = await whatsappClient.connect();
    res.json({
      success: success,
      message: success ? 'WhatsApp inicializando... Aguarde QR code ou conexão automática.' : 'Erro ao inicializar WhatsApp'
    });
  } catch (error) {
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
router.post('/send-test', async (req, res): Promise<void> => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({
        success: false,
        error: 'Número de telefone é obrigatório'
      });
      return;
    }

    const sent = await whatsappClient.testMessage(phoneNumber);

    if (sent) {
      res.json({
        success: true,
        message: 'Mensagem de teste enviada com sucesso!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha ao enviar mensagem de teste'
      });
    }
  } catch (error) {
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
router.post('/send-completion', async (req, res): Promise<void> => {
  try {
    const { clientName, clientPhone, serviceName } = req.body;

    if (!clientName || !clientPhone || !serviceName) {
      res.status(400).json({
        success: false,
        error: 'Nome do cliente, telefone e nome do serviço são obrigatórios'
      });
      return;
    }

    const sent = await whatsappClient.sendServiceCompletedNotification(
      clientName,
      clientPhone,
      serviceName
    );

    if (sent) {
      res.json({
        success: true,
        message: 'Notificação de conclusão enviada com sucesso!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha ao enviar notificação'
      });
    }
  } catch (error) {
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
router.post('/send-reminder', async (req, res): Promise<void> => {
  try {
    const { clientName, clientPhone, serviceName, date, time } = req.body;

    if (!clientName || !clientPhone || !serviceName || !date || !time) {
      res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
      return;
    }

    const sent = await whatsappClient.sendReminderNotification(
      clientName,
      clientPhone,
      serviceName,
      date,
      time
    );

    if (sent) {
      res.json({
        success: true,
        message: 'Lembrete enviado com sucesso!'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Falha ao enviar lembrete'
      });
    }
  } catch (error) {
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
    await whatsappClient.disconnect();
    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao desconectar WhatsApp'
    });
  }
});

/**
 * @route POST /api/whatsapp/reset
 * @desc Reset WhatsApp connection (disconnect + reconnect)
 * @access Private (Admin)
 */
router.post('/reset', async (req, res) => {
  try {
    console.log('🔄 Resetando conexão WhatsApp...');

    // First disconnect
    await whatsappClient.disconnect();

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then reconnect
    const success = await whatsappClient.connect();

    res.json({
      success: success,
      message: success ? 'WhatsApp resetado com sucesso' : 'Falha ao resetar WhatsApp'
    });
  } catch (error) {
    console.error('Erro ao resetar WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao resetar WhatsApp'
    });
  }
});

export default router;