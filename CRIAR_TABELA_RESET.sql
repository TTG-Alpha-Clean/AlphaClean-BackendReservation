-- Execute este SQL no Supabase SQL Editor
-- Para criar a tabela de tokens de reset de senha

-- Cria tabela de tokens de reset de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_usuario ON password_reset_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Armazena tokens temporários para recuperação de senha';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único gerado para reset de senha';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data e hora de expiração do token (1 hora após criação)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Indica se o token já foi utilizado';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Data e hora em que o token foi utilizado';

-- Mostra resultado
SELECT 'Tabela password_reset_tokens criada com sucesso!' AS status;

-- Para verificar se foi criada:
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'password_reset_tokens';
