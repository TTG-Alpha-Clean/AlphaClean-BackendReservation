-- =============================================
-- PARTE 1: RECRIAR TABELAS COM INTEGER ID
-- Alpha Clean - Todas exceto usuarios
-- =============================================

-- Dropar tabelas existentes (CASCADE remove as dependências)
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS service_informations CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS telefones CASCADE;

-- =============================================
-- TABELA: telefones
-- =============================================
CREATE TABLE telefones (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ddd VARCHAR(2) NOT NULL,
    numero VARCHAR(9) NOT NULL,
    is_whatsapp BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABELA: services
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
-- TABELA: agendamentos
-- =============================================
CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    modelo_veiculo VARCHAR(255) NOT NULL,
    cor VARCHAR(100),
    placa VARCHAR(7) NOT NULL,
    servico_id INTEGER NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'agendado',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_telefones_usuario_id ON telefones(usuario_id);
CREATE INDEX idx_telefones_is_whatsapp ON telefones(is_whatsapp);
CREATE INDEX idx_telefones_is_primary ON telefones(is_primary);

CREATE INDEX idx_services_type ON services(type);
CREATE INDEX idx_services_deleted_at ON services(deleted_at);

CREATE INDEX idx_service_informations_service_id ON service_informations(service_id);

CREATE INDEX idx_cars_usuario_id ON cars(usuario_id);
CREATE INDEX idx_cars_placa ON cars(placa);
CREATE INDEX idx_cars_is_default ON cars(is_default);

CREATE INDEX idx_agendamentos_usuario_id ON agendamentos(usuario_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(data);
CREATE INDEX idx_agendamentos_horario ON agendamentos(horario);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_placa ON agendamentos(placa);
CREATE INDEX idx_agendamentos_servico_id ON agendamentos(servico_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_informations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA TELEFONES
-- =============================================

CREATE POLICY "telefones_select_own" ON telefones
    FOR SELECT
    USING (usuario_id = auth.uid());

CREATE POLICY "telefones_insert_own" ON telefones
    FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "telefones_update_own" ON telefones
    FOR UPDATE
    USING (usuario_id = auth.uid());

CREATE POLICY "telefones_delete_own" ON telefones
    FOR DELETE
    USING (usuario_id = auth.uid());

-- Admins podem ver todos os telefones
CREATE POLICY "telefones_select_admin" ON telefones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- POLÍTICAS PARA SERVICES
-- =============================================

CREATE POLICY "services_select_public" ON services
    FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY "services_insert_admin" ON services
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "services_update_admin" ON services
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

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

CREATE POLICY "service_informations_select_public" ON service_informations
    FOR SELECT
    USING (true);

CREATE POLICY "service_informations_insert_admin" ON service_informations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "service_informations_update_admin" ON service_informations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

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

CREATE POLICY "cars_select_own" ON cars
    FOR SELECT
    USING (usuario_id = auth.uid());

CREATE POLICY "cars_insert_own" ON cars
    FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "cars_update_own" ON cars
    FOR UPDATE
    USING (usuario_id = auth.uid());

CREATE POLICY "cars_delete_own" ON cars
    FOR DELETE
    USING (usuario_id = auth.uid());

-- =============================================
-- POLÍTICAS PARA AGENDAMENTOS
-- =============================================

-- Usuários veem apenas seus próprios agendamentos
CREATE POLICY "agendamentos_select_own" ON agendamentos
    FOR SELECT
    USING (usuario_id = auth.uid());

-- Usuários criam agendamentos apenas para si mesmos
CREATE POLICY "agendamentos_insert_own" ON agendamentos
    FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

-- Usuários atualizam apenas seus próprios agendamentos
CREATE POLICY "agendamentos_update_own" ON agendamentos
    FOR UPDATE
    USING (usuario_id = auth.uid());

-- Usuários deletam apenas seus próprios agendamentos
CREATE POLICY "agendamentos_delete_own" ON agendamentos
    FOR DELETE
    USING (usuario_id = auth.uid());

-- Admins podem ver todos os agendamentos
CREATE POLICY "agendamentos_select_admin" ON agendamentos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins podem atualizar todos os agendamentos
CREATE POLICY "agendamentos_update_admin" ON agendamentos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE telefones IS 'Telefones dos usuários';
COMMENT ON TABLE services IS 'Serviços oferecidos no site';
COMMENT ON TABLE service_informations IS 'Itens inclusos em cada serviço';
COMMENT ON TABLE cars IS 'Veículos cadastrados pelos usuários';
COMMENT ON TABLE agendamentos IS 'Agendamentos de serviços';

-- =============================================
-- VERIFICAÇÃO
-- =============================================
SELECT
    'telefones' as table_name,
    COUNT(*) as row_count
FROM telefones
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'service_informations', COUNT(*) FROM service_informations
UNION ALL
SELECT 'cars', COUNT(*) FROM cars
UNION ALL
SELECT 'agendamentos', COUNT(*) FROM agendamentos;
