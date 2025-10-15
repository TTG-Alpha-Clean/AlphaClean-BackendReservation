-- =============================================
-- RECRIAR TABELAS COM INTEGER ID + RLS
-- Alpha Clean - Services, Service Informations e Cars
-- =============================================

-- Dropar tabelas existentes (CASCADE remove as dependências)
DROP TABLE IF EXISTS service_informations CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS cars CASCADE;

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
-- TABELA: cars
-- Armazena os veículos dos usuários
-- =============================================
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    modelo_veiculo VARCHAR(255) NOT NULL,
    cor VARCHAR(100),
    placa VARCHAR(7) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =============================================
CREATE INDEX idx_services_type ON services(type);
CREATE INDEX idx_services_deleted_at ON services(deleted_at);
CREATE INDEX idx_service_informations_service_id ON service_informations(service_id);
CREATE INDEX idx_cars_usuario_id ON cars(usuario_id);
CREATE INDEX idx_cars_placa ON cars(placa);
CREATE INDEX idx_cars_is_default ON cars(is_default);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS nas tabelas
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_informations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA SERVICES
-- =============================================

-- Permitir leitura pública (qualquer um pode ver serviços não deletados)
CREATE POLICY "services_select_public" ON services
    FOR SELECT
    USING (deleted_at IS NULL);

-- Apenas admins podem inserir
CREATE POLICY "services_insert_admin" ON services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Apenas admins podem atualizar
CREATE POLICY "services_update_admin" ON services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Apenas admins podem deletar
CREATE POLICY "services_delete_admin" ON services
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA SERVICE_INFORMATIONS
-- =============================================

-- Permitir leitura pública
CREATE POLICY "service_informations_select_public" ON service_informations
    FOR SELECT
    USING (true);

-- Apenas admins podem inserir
CREATE POLICY "service_informations_insert_admin" ON service_informations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Apenas admins podem atualizar
CREATE POLICY "service_informations_update_admin" ON service_informations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Apenas admins podem deletar
CREATE POLICY "service_informations_delete_admin" ON service_informations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA CARS
-- =============================================

-- Usuários podem ver apenas seus próprios carros
CREATE POLICY "cars_select_own" ON cars
    FOR SELECT
    USING (usuario_id = auth.uid());

-- Usuários podem inserir apenas carros para si mesmos
CREATE POLICY "cars_insert_own" ON cars
    FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

-- Usuários podem atualizar apenas seus próprios carros
CREATE POLICY "cars_update_own" ON cars
    FOR UPDATE
    USING (usuario_id = auth.uid());

-- Usuários podem deletar apenas seus próprios carros
CREATE POLICY "cars_delete_own" ON cars
    FOR DELETE
    USING (usuario_id = auth.uid());

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
COMMENT ON COLUMN service_informations.service_id IS 'ID do serviço relacionado';
COMMENT ON COLUMN service_informations.description IS 'Descrição do benefício/item incluso no serviço';

COMMENT ON TABLE cars IS 'Veículos cadastrados pelos usuários';
COMMENT ON COLUMN cars.usuario_id IS 'ID do usuário dono do veículo';
COMMENT ON COLUMN cars.modelo_veiculo IS 'Modelo do veículo';
COMMENT ON COLUMN cars.placa IS 'Placa do veículo (formato Mercosul ABC1D23)';
COMMENT ON COLUMN cars.is_default IS 'Define se é o veículo padrão do usuário';
COMMENT ON COLUMN cars.ativo IS 'Define se o veículo está ativo';

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
FROM service_informations
UNION ALL
SELECT
    'cars' as table_name,
    COUNT(*) as row_count
FROM cars;
