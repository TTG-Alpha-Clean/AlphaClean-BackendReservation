-- =============================================
-- PARTE 3: CRIAR USUÁRIO ADMIN
-- ⚠️ EXECUTE APENAS DEPOIS DOS OUTROS 2 SQLs
-- =============================================

-- OPÇÃO 1: Inserir com hash temporário (VOCÊ PRECISA TROCAR DEPOIS)
-- Este hash é para a senha "admin123"
-- Hash gerado com: bcrypt.hash('admin123', 10)

INSERT INTO usuarios (nome, email, senha, role, created_at, updated_at)
VALUES (
    'Administrador Alpha Clean',
    'admin@alphaclean.com',
    '$2b$10$YourHashHere',  -- ⚠️ SUBSTITUIR PELO HASH REAL
    'admin',
    NOW(),
    NOW()
);

-- =============================================
-- OPÇÃO 2 (RECOMENDADA): Use o endpoint de registro do backend
-- =============================================
-- Após executar os SQLs, faça uma requisição POST para criar o admin:
/*
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "nome": "Administrador Alpha Clean",
  "email": "admin@alphaclean.com",
  "senha": "admin123",
  "ddd": "11",
  "numero": "999999999"
}

Depois atualize manualmente o role para admin:
UPDATE usuarios SET role = 'admin' WHERE email = 'admin@alphaclean.com';
*/

-- Verificar se o usuário foi criado
SELECT id, nome, email, role, created_at
FROM usuarios
WHERE email = 'admin@alphaclean.com';
