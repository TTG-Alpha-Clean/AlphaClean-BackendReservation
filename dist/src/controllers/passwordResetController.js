"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyResetToken = exports.resetPassword = exports.forgotPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../database");
const email_1 = require("../config/email");
/**
 * POST /api/auth/forgot-password
 * Solicita reset de senha - envia email com token
 */
const forgotPassword = async (req, res) => {
    let client;
    try {
        const { email } = req.body;
        console.log('🔵 [ForgotPassword] Iniciando processo para email:', email);
        // Validação
        if (!email) {
            console.log('❌ [ForgotPassword] Email não fornecido');
            res.status(400).json({ error: 'Email é obrigatório' });
            return;
        }
        // Verifica variáveis de ambiente
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.error('❌ [ForgotPassword] Variáveis de ambiente EMAIL_USER ou EMAIL_PASSWORD não configuradas');
            res.status(503).json({
                error: 'Serviço de email não configurado. Entre em contato com o suporte.'
            });
            return;
        }
        client = await database_1.pool.connect();
        console.log('✅ [ForgotPassword] Conexão com banco estabelecida');
        // Busca usuário pelo email
        const userResult = await client.query('SELECT id, nome, email FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
        console.log('🔍 [ForgotPassword] Usuário encontrado:', userResult.rows.length > 0);
        // Por segurança, sempre retorna sucesso (mesmo se email não existir)
        // Isso evita que atacantes descubram quais emails estão cadastrados
        if (userResult.rows.length === 0) {
            console.log(`⚠️ [ForgotPassword] Email não cadastrado: ${email}`);
            res.status(200).json({
                message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
            });
            return;
        }
        const user = userResult.rows[0];
        // Gera token único e seguro
        const token = crypto_1.default.randomBytes(32).toString('hex');
        console.log('🔑 [ForgotPassword] Token gerado');
        // Token expira em 1 hora
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await client.query('BEGIN');
        console.log('📝 [ForgotPassword] Transação iniciada');
        // Verifica se a tabela existe
        try {
            // Invalida tokens anteriores do mesmo usuário
            await client.query('UPDATE password_reset_tokens SET used = TRUE WHERE usuario_id = $1 AND used = FALSE', [user.id]);
            // Insere novo token
            await client.query(`INSERT INTO password_reset_tokens (usuario_id, token, expires_at)
         VALUES ($1, $2, $3)`, [user.id, token, expiresAt]);
            console.log('✅ [ForgotPassword] Token salvo no banco');
        }
        catch (dbError) {
            console.error('❌ [ForgotPassword] Erro ao salvar token no banco:', dbError.message);
            if (dbError.message.includes('does not exist') || dbError.code === '42P01') {
                await client.query('ROLLBACK');
                res.status(503).json({
                    error: 'Tabela de reset de senha não existe. Execute o script SQL: database/4_create_password_reset_tokens.sql'
                });
                return;
            }
            throw dbError;
        }
        await client.query('COMMIT');
        console.log('✅ [ForgotPassword] Transação commitada');
        // Envia email
        try {
            console.log('📧 [ForgotPassword] Tentando enviar email...');
            await (0, email_1.sendPasswordResetEmail)(user.email, user.nome, token);
            console.log(`✅ [ForgotPassword] Email enviado para: ${user.email}`);
        }
        catch (emailError) {
            console.error('❌ [ForgotPassword] Erro ao enviar email:', emailError.message);
            console.error('Stack:', emailError.stack);
            // Não faz rollback pois o token já foi salvo
            // Retorna erro específico
            res.status(500).json({
                error: 'Token criado mas erro ao enviar email. Verifique configurações de email no servidor.',
                details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
            return;
        }
        res.status(200).json({
            message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
        });
    }
    catch (error) {
        if (client) {
            await client.query('ROLLBACK').catch(() => { });
        }
        console.error('❌ [ForgotPassword] Erro geral:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Erro ao processar solicitação',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
    finally {
        if (client) {
            client.release();
            console.log('🔌 [ForgotPassword] Conexão liberada');
        }
    }
};
exports.forgotPassword = forgotPassword;
/**
 * POST /api/auth/reset-password
 * Redefine a senha usando o token recebido por email
 */
const resetPassword = async (req, res) => {
    const client = await database_1.pool.connect();
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
        const tokenResult = await client.query(`SELECT id, usuario_id, expires_at, used
       FROM password_reset_tokens
       WHERE token = $1`, [token]);
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
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Atualiza senha do usuário
        await client.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [hashedPassword, resetToken.usuario_id]);
        // Marca token como usado
        await client.query('UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1', [resetToken.id]);
        await client.query('COMMIT');
        console.log(`Senha redefinida com sucesso para usuário ID: ${resetToken.usuario_id}`);
        res.status(200).json({
            message: 'Senha redefinida com sucesso! Você já pode fazer login com a nova senha.',
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro em resetPassword:', error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
    finally {
        client.release();
    }
};
exports.resetPassword = resetPassword;
/**
 * GET /api/auth/verify-reset-token/:token
 * Verifica se um token de reset é válido (usado antes de mostrar o formulário)
 */
const verifyResetToken = async (req, res) => {
    const client = await database_1.pool.connect();
    try {
        const { token } = req.params;
        if (!token) {
            res.status(400).json({ error: 'Token é obrigatório' });
            return;
        }
        const tokenResult = await client.query(`SELECT id, expires_at, used
       FROM password_reset_tokens
       WHERE token = $1`, [token]);
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
    }
    catch (error) {
        console.error('Erro em verifyResetToken:', error);
        res.status(500).json({ valid: false, error: 'Erro ao verificar token' });
    }
    finally {
        client.release();
    }
};
exports.verifyResetToken = verifyResetToken;
//# sourceMappingURL=passwordResetController.js.map