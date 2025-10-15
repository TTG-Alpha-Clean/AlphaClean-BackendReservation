-- ============================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================
-- Este SQL adiciona as colunas 'ano', 'marca' e 'observacoes' na tabela cars
-- e remove todas as colunas 'ativo' do banco de dados
-- ============================================

-- 1. Adicionar coluna 'ano' na tabela cars
ALTER TABLE cars
ADD COLUMN IF NOT EXISTS ano VARCHAR(4);

-- 2. Adicionar coluna 'marca' na tabela cars
ALTER TABLE cars
ADD COLUMN IF NOT EXISTS marca VARCHAR(100);

-- 3. Adicionar coluna 'observacoes' na tabela cars
ALTER TABLE cars
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 4. Remover coluna 'ativo' da tabela cars (se existir)
ALTER TABLE cars
DROP COLUMN IF EXISTS ativo;

-- 4. Verificar se existe coluna 'ativo' em outras tabelas e remover
-- Nota: Ajuste conforme necessário se houver outras tabelas com 'ativo'

-- 5. Confirmar as alterações
SELECT 'Alterações concluídas com sucesso!' as status;

-- Verificar estrutura da tabela cars após as alterações
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cars'
ORDER BY ordinal_position;
