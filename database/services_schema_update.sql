-- =============================================
-- SCRIPT DE ATUALIZAÇÃO DAS TABELAS SERVICES
-- Alpha Clean - Sistema de Gerenciamento de Serviços
-- =============================================
-- IMPORTANTE: Este script atualiza as tabelas existentes 'servicos' e 'servico_informacoes'
-- para suportar o novo sistema de gerenciamento de serviços do site
-- =============================================

-- =============================================
-- VERIFICAR TABELAS EXISTENTES
-- =============================================
DO $$
BEGIN
    -- Verificar se a tabela servicos existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'servicos') THEN
        RAISE NOTICE 'Tabela servicos já existe. Verificando colunas...';

        -- Adicionar coluna type se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'type') THEN
            ALTER TABLE servicos ADD COLUMN type VARCHAR(50);
            RAISE NOTICE 'Coluna type adicionada à tabela servicos';
        END IF;

        -- Adicionar coluna title se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'title') THEN
            ALTER TABLE servicos ADD COLUMN title VARCHAR(255);
            RAISE NOTICE 'Coluna title adicionada à tabela servicos';
        END IF;

        -- Adicionar coluna subtitle se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'subtitle') THEN
            ALTER TABLE servicos ADD COLUMN subtitle VARCHAR(255);
            RAISE NOTICE 'Coluna subtitle adicionada à tabela servicos';
        END IF;

        -- Adicionar coluna time_minutes se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'time_minutes') THEN
            ALTER TABLE servicos ADD COLUMN time_minutes INTEGER DEFAULT 30;
            RAISE NOTICE 'Coluna time_minutes adicionada à tabela servicos';
        END IF;

        -- Adicionar coluna description se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'description') THEN
            ALTER TABLE servicos ADD COLUMN description TEXT;
            RAISE NOTICE 'Coluna description adicionada à tabela servicos';
        END IF;

        -- Adicionar coluna image_url se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'image_url') THEN
            ALTER TABLE servicos ADD COLUMN image_url TEXT;
            RAISE NOTICE 'Coluna image_url adicionada à tabela servicos';
        END IF;

        -- Adicionar coluna deleted_at se não existir (soft delete)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'deleted_at') THEN
            ALTER TABLE servicos ADD COLUMN deleted_at TIMESTAMP;
            RAISE NOTICE 'Coluna deleted_at adicionada à tabela servicos';
        END IF;

    ELSE
        RAISE EXCEPTION 'Tabela servicos não existe! Execute primeiro o script de criação base.';
    END IF;

    -- Verificar se a tabela servico_informacoes existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'servico_informacoes') THEN
        RAISE NOTICE 'Tabela servico_informacoes já existe e está pronta para uso.';
    ELSE
        RAISE EXCEPTION 'Tabela servico_informacoes não existe! Execute primeiro o script de criação base.';
    END IF;
END $$;

-- =============================================
-- CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_servicos_type ON servicos(type);
CREATE INDEX IF NOT EXISTS idx_servicos_deleted_at ON servicos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_servicos_ativo ON servicos(ativo);
CREATE INDEX IF NOT EXISTS idx_servico_informacoes_servico_id ON servico_informacoes(servico_id);

-- =============================================
-- ADICIONAR COMENTÁRIOS NAS COLUNAS
-- =============================================
COMMENT ON COLUMN servicos.type IS 'Tipo do serviço: Básico, Completo, Premium, Proteção, Especializado';
COMMENT ON COLUMN servicos.title IS 'Título do serviço para exibição no site';
COMMENT ON COLUMN servicos.subtitle IS 'Subtítulo opcional do serviço';
COMMENT ON COLUMN servicos.time_minutes IS 'Tempo estimado de execução em minutos';
COMMENT ON COLUMN servicos.description IS 'Descrição completa do serviço';
COMMENT ON COLUMN servicos.image_url IS 'URL da imagem hospedada no Cloudinary';
COMMENT ON COLUMN servicos.deleted_at IS 'Data de exclusão (soft delete)';

COMMENT ON TABLE servico_informacoes IS 'Itens inclusos em cada serviço';
COMMENT ON COLUMN servico_informacoes.description IS 'Descrição do benefício/item incluso no serviço';

-- =============================================
-- MIGRAÇÃO DE DADOS EXISTENTES (OPCIONAL)
-- =============================================
-- Atualizar serviços existentes com dados básicos se as colunas novas estiverem vazias
UPDATE servicos
SET
    type = CASE
        WHEN valor < 50 THEN 'Básico'
        WHEN valor < 100 THEN 'Completo'
        ELSE 'Premium'
    END,
    title = nome,
    time_minutes = COALESCE(time_minutes, 30)
WHERE type IS NULL;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT
    'servicos' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN ativo = true AND deleted_at IS NULL THEN 1 END) as active_records,
    COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_images
FROM servicos
UNION ALL
SELECT
    'servico_informacoes' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT servico_id) as services_with_info,
    NULL as with_images
FROM servico_informacoes;

-- =============================================
-- EXIBIR ESTRUTURA DAS TABELAS
-- =============================================
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('servicos', 'servico_informacoes')
ORDER BY table_name, ordinal_position;

RAISE NOTICE '✅ Script de atualização executado com sucesso!';
RAISE NOTICE 'As tabelas servicos e servico_informacoes estão prontas para uso.';
