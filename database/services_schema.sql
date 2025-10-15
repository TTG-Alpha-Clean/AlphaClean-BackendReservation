-- =============================================
-- SCRIPT DE CRIAÇÃO DAS TABELAS SERVICES
-- Alpha Clean - Sistema de Gerenciamento de Serviços
-- =============================================

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: services
-- Armazena os serviços oferecidos no site
-- =============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,  -- Tipo do serviço (Básico, Completo, Premium, etc)
    title VARCHAR(255) NOT NULL,  -- Título do serviço
    subtitle VARCHAR(255),  -- Subtítulo opcional
    valor DECIMAL(10, 2) NOT NULL,  -- Preço do serviço
    time_minutes INTEGER NOT NULL DEFAULT 30,  -- Tempo estimado em minutos
    description TEXT,  -- Descrição completa do serviço
    image_url TEXT,  -- URL da imagem no Cloudinary
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP  -- Soft delete
);

-- =============================================
-- TABELA: service_informations
-- Armazena os itens inclusos em cada serviço
-- =============================================
CREATE TABLE IF NOT EXISTS service_informations (
    id SERIAL PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    description TEXT NOT NULL,  -- Descrição do item incluso
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_services_type ON services(type);
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at);
CREATE INDEX IF NOT EXISTS idx_service_informations_service_id ON service_informations(service_id);

-- =============================================
-- COMENTÁRIOS NAS TABELAS
-- =============================================
COMMENT ON TABLE services IS 'Tabela de serviços exibidos no site';
COMMENT ON COLUMN services.type IS 'Tipo do serviço: Básico, Completo, Premium, Proteção, Especializado';
COMMENT ON COLUMN services.valor IS 'Preço do serviço em reais';
COMMENT ON COLUMN services.time_minutes IS 'Tempo estimado de execução em minutos';
COMMENT ON COLUMN services.image_url IS 'URL da imagem hospedada no Cloudinary';
COMMENT ON COLUMN services.deleted_at IS 'Data de exclusão (soft delete)';

COMMENT ON TABLE service_informations IS 'Itens inclusos em cada serviço';
COMMENT ON COLUMN service_informations.description IS 'Descrição do benefício/item incluso no serviço';

-- =============================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =============================================
-- Descomente para inserir dados de exemplo

/*
INSERT INTO services (type, title, subtitle, valor, time_minutes, description) VALUES
('Básico', 'Lavagem Simples', 'Ideal para manutenção semanal', 25.00, 30, 'Lavagem externa completa do seu veículo com produtos de qualidade profissional'),
('Completo', 'Lavagem Completa', 'O mais escolhido pelos clientes', 45.00, 45, 'Cuidado completo externo e interno básico para seu veículo');

-- Inserir informações para o primeiro serviço
INSERT INTO service_informations (service_id, description)
SELECT id, 'Pré-lavagem com água pressurizada'
FROM services WHERE title = 'Lavagem Simples'
LIMIT 1;

INSERT INTO service_informations (service_id, description)
SELECT id, 'Xampu automotivo neutro pH'
FROM services WHERE title = 'Lavagem Simples'
LIMIT 1;

INSERT INTO service_informations (service_id, description)
SELECT id, 'Limpeza completa de pneus e rodas'
FROM services WHERE title = 'Lavagem Simples'
LIMIT 1;

INSERT INTO service_informations (service_id, description)
SELECT id, 'Secagem com flanela de microfibra'
FROM services WHERE title = 'Lavagem Simples'
LIMIT 1;

-- Inserir informações para o segundo serviço
INSERT INTO service_informations (service_id, description)
SELECT id, 'Tudo da lavagem simples'
FROM services WHERE title = 'Lavagem Completa'
LIMIT 1;

INSERT INTO service_informations (service_id, description)
SELECT id, 'Aspiração completa do interior'
FROM services WHERE title = 'Lavagem Completa'
LIMIT 1;

INSERT INTO service_informations (service_id, description)
SELECT id, 'Limpeza do painel e console'
FROM services WHERE title = 'Lavagem Completa'
LIMIT 1;

INSERT INTO service_informations (service_id, description)
SELECT id, 'Limpeza dos tapetes'
FROM services WHERE title = 'Lavagem Completa'
LIMIT 1;
*/

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
