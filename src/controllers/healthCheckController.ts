// src/controllers/healthCheckController.ts
import { Request, Response } from 'express';
import { pool } from '../database';

/**
 * GET /api/auth/health-check-reset
 * Verifica se o sistema de reset de senha está configurado corretamente
 */
export const healthCheckReset = async (req: Request, res: Response): Promise<void> => {
  const checks = {
    emailConfigured: false,
    emailUser: '',
    frontendUrl: '',
    databaseConnection: false,
    tableExists: false,
    details: [] as string[],
  };

  try {
    // 1. Verificar variáveis de ambiente
    checks.emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    checks.emailUser = process.env.EMAIL_USER || 'NÃO CONFIGURADO';
    checks.frontendUrl = process.env.FRONTEND_URL || 'NÃO CONFIGURADO';

    if (!process.env.EMAIL_USER) {
      checks.details.push('❌ EMAIL_USER não configurado');
    } else {
      checks.details.push(`✅ EMAIL_USER: ${process.env.EMAIL_USER}`);
    }

    if (!process.env.EMAIL_PASSWORD) {
      checks.details.push('❌ EMAIL_PASSWORD não configurado');
    } else {
      checks.details.push(`✅ EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD.substring(0, 4)}****`);
    }

    if (!process.env.FRONTEND_URL) {
      checks.details.push('❌ FRONTEND_URL não configurado');
    } else {
      checks.details.push(`✅ FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    }

    // 2. Verificar conexão com banco
    const client = await pool.connect();
    checks.databaseConnection = true;
    checks.details.push('✅ Conexão com banco de dados OK');

    // 3. Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'password_reset_tokens'
      ) as exists;
    `);

    checks.tableExists = tableCheck.rows[0].exists;

    if (checks.tableExists) {
      checks.details.push('✅ Tabela password_reset_tokens existe');

      // Verificar se RLS está ativo
      const rlsCheck = await client.query(`
        SELECT relrowsecurity as rls_enabled
        FROM pg_class
        WHERE relname = 'password_reset_tokens';
      `);

      if (rlsCheck.rows[0]?.rls_enabled) {
        checks.details.push('✅ RLS habilitado na tabela');
      } else {
        checks.details.push('⚠️ RLS não está habilitado na tabela');
      }

      // Contar tokens
      const countResult = await client.query('SELECT COUNT(*) as count FROM password_reset_tokens');
      checks.details.push(`📊 Tokens na tabela: ${countResult.rows[0].count}`);
    } else {
      checks.details.push('❌ Tabela password_reset_tokens NÃO EXISTE');
      checks.details.push('Execute o SQL: database/4_create_password_reset_tokens.sql');
    }

    client.release();

    // Determinar status geral
    const allOk = checks.emailConfigured && checks.databaseConnection && checks.tableExists;

    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      message: allOk
        ? '✅ Sistema de reset de senha configurado corretamente'
        : '❌ Sistema de reset de senha com problemas de configuração',
    });
  } catch (error: any) {
    checks.details.push(`❌ Erro: ${error.message}`);

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      checks,
      error: error.message,
    });
  }
};
