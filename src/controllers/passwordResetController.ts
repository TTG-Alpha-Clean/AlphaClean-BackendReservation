// src/controllers/passwordResetController.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../database';
import { sendPasswordResetEmail } from '../config/email';

/**
 * POST /api/auth/forgot-password
 * Solicita reset de senha - envia email com token
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { email } = req.body;

    // Validação
    if (!email) {
      res.status(400).json({ error: 'Email é obrigatório' });
      return;
    }

    // Busca usuário pelo email
    const userResult = await client.query(
      'SELECT id, nome, email, active FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // Por segurança, sempre retorna sucesso (mesmo se email não existir)
    // Isso evita que atacantes descubram quais emails estão cadastrados
    if (userResult.rows.length === 0) {
      console.log(`Tentativa de reset para email não cadastrado: ${email}`);
      res.status(200).json({
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
      });
      return;
    }

    const user = userResult.rows[0];

    // Verifica se usuário está ativo
    if (!user.active) {
      res.status(200).json({
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
      });
      return;
    }

    // Gera token único e seguro
    const token = crypto.randomBytes(32).toString('hex');

    // Token expira em 1 hora
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await client.query('BEGIN');

    // Invalida tokens anteriores do mesmo usuário (opcional, mas recomendado)
    await client.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE usuario_id = $1 AND used = FALSE',
      [user.id]
    );

    // Insere novo token
    await client.query(
      `INSERT INTO password_reset_tokens (usuario_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    await client.query('COMMIT');

    // Envia email
    try {
      await sendPasswordResetEmail(user.email, user.nome, token);
      console.log(`Email de reset enviado para: ${user.email}`);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Rollback se falhar ao enviar email
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Erro ao enviar email de recuperação' });
      return;
    }

    res.status(200).json({
      message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro em forgotPassword:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  } finally {
    client.release();
  }
};

/**
 * POST /api/auth/reset-password
 * Redefine a senha usando o token recebido por email
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { token, newPassword } = req.body;

    // Validação
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
      return;
    }

    // Validação de senha
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
      return;
    }

    // Busca token no banco
    const tokenResult = await client.query(
      `SELECT id, usuario_id, expires_at, used
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      res.status(400).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const resetToken = tokenResult.rows[0];

    // Verifica se token já foi usado
    if (resetToken.used) {
      res.status(400).json({ error: 'Este token já foi utilizado' });
      return;
    }

    // Verifica se token expirou
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      res.status(400).json({ error: 'Token expirado. Solicite um novo link de recuperação.' });
      return;
    }

    await client.query('BEGIN');

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza senha do usuário
    await client.query(
      'UPDATE usuarios SET senha = $1 WHERE id = $2',
      [hashedPassword, resetToken.usuario_id]
    );

    // Marca token como usado
    await client.query(
      'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1',
      [resetToken.id]
    );

    await client.query('COMMIT');

    console.log(`Senha redefinida com sucesso para usuário ID: ${resetToken.usuario_id}`);

    res.status(200).json({
      message: 'Senha redefinida com sucesso! Você já pode fazer login com a nova senha.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro em resetPassword:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  } finally {
    client.release();
  }
};

/**
 * GET /api/auth/verify-reset-token/:token
 * Verifica se um token de reset é válido (usado antes de mostrar o formulário)
 */
export const verifyResetToken = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ error: 'Token é obrigatório' });
      return;
    }

    const tokenResult = await client.query(
      `SELECT id, expires_at, used
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      res.status(400).json({ valid: false, error: 'Token inválido' });
      return;
    }

    const resetToken = tokenResult.rows[0];

    if (resetToken.used) {
      res.status(400).json({ valid: false, error: 'Token já utilizado' });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      res.status(400).json({ valid: false, error: 'Token expirado' });
      return;
    }

    res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Erro em verifyResetToken:', error);
    res.status(500).json({ valid: false, error: 'Erro ao verificar token' });
  } finally {
    client.release();
  }
};
