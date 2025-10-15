-- =============================================
-- RECRIAR TABELAS SERVICES COM INTEGER ID + RLS
-- Alpha Clean - Sistema de Gerenciamento de Serviços
-- =============================================

-- Dropar tabelas existentes
DROP TABLE IF EXISTS service_informations CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- =============================================
-- TABELA: services
-- Armazena os serviços oferecidos no site
-- =============================================
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    valor DECIMAL(10, 2) NOT NULL,
    time_minutes INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- =============================================
-- TABELA: service_informations
-- Armazena os itens inclusos em cada serviço
-- =============================================
CREATE TABLE service_informations (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =============================================
CREATE INDEX idx_services_type ON services(type);
CREATE INDEX idx_services_deleted_at ON services(deleted_at);
CREATE INDEX idx_service_informations_service_id ON service_informations(service_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_informations ENABLE ROW LEVEL SECURITY;

-- Políticas para services
-- Permitir leitura pública (qualquer um pode ver serviços)
CREATE POLICY "services_select_public" ON services
    FOR SELECT
    USING (deleted_at IS NULL);

-- Apenas admins podem inserir, atualizar e deletar
CREATE POLICY "services_insert_admin" ON services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "services_update_admin" ON services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "services_delete_admin" ON services
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Políticas para service_informations
-- Permitir leitura pública
CREATE POLICY "service_informations_select_public" ON service_informations
    FOR SELECT
    USING (true);

-- Apenas admins podem inserir, atualizar e deletar
CREATE POLICY "service_informations_insert_admin" ON service_informations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "service_informations_update_admin" ON service_informations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "service_informations_delete_admin" ON service_informations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

-- =============================================
-- COMENTÁRIOS NAS TABELAS
-- =============================================
COMMENT ON TABLE services IS 'Tabela de serviços exibidos no site';
COMMENT ON COLUMN services.id IS 'ID sequencial do serviço';
COMMENT ON COLUMN services.type IS 'Tipo do serviço: Básico, Completo, Premium, Proteção, Especializado';
COMMENT ON COLUMN services.valor IS 'Preço do serviço em reais';
COMMENT ON COLUMN services.time_minutes IS 'Tempo estimado de execução em minutos';
COMMENT ON COLUMN services.image_url IS 'URL da imagem hospedada no Cloudinary';
COMMENT ON COLUMN services.deleted_at IS 'Data de exclusão (soft delete)';

COMMENT ON TABLE service_informations IS 'Itens inclusos em cada serviço';
COMMENT ON COLUMN service_informations.description IS 'Descrição do benefício/item incluso no serviço';

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT
    'services' as table_name,
    COUNT(*) as row_count
FROM services
UNION ALL
SELECT
    'service_informations' as table_name,
    COUNT(*) as row_count
FROM service_informations;
