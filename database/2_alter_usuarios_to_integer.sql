-- =============================================
-- PARTE 2: ALTERAR TABELA USUARIOS DE UUID PARA INTEGER
-- ⚠️ EXECUTE APENAS DEPOIS DO SQL ANTERIOR
-- =============================================

-- IMPORTANTE: Este script vai APAGAR todos os dados da tabela usuarios
-- porque não é possível converter UUID para INTEGER mantendo os dados

-- =============================================
-- BACKUP DOS DADOS (opcional - execute se quiser guardar)
-- =============================================
-- CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;

-- =============================================
-- RECRIAR TABELA USUARIOS
-- =============================================

-- Dropar tabela usuarios (CASCADE vai dropar as tabelas dependentes)
-- Mas como já dropamos tudo antes, isso é só pra garantir
DROP TABLE IF EXISTS usuarios CASCADE;

-- Recriar com INTEGER ID
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_role ON usuarios(role);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seu próprio registro
CREATE POLICY "usuarios_select_own" ON usuarios
    FOR SELECT
    USING (id::text = auth.uid()::text);

-- Usuários podem atualizar apenas seu próprio registro
CREATE POLICY "usuarios_update_own" ON usuarios
    FOR UPDATE
    USING (id::text = auth.uid()::text);

-- Admins podem ver todos os usuários
CREATE POLICY "usuarios_select_admin" ON usuarios
    FOR SELECT
    USING (role = 'admin' AND id::text = auth.uid()::text);

-- Permitir INSERT público (para registro)
CREATE POLICY "usuarios_insert_public" ON usuarios
    FOR INSERT
    WITH CHECK (true);

-- =============================================
-- RECRIAR TABELAS DEPENDENTES COM INTEGER
-- =============================================

-- Telefones
DROP TABLE IF EXISTS telefones CASCADE;
CREATE TABLE telefones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ddd VARCHAR(2) NOT NULL,
    numero VARCHAR(9) NOT NULL,
    is_whatsapp BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_telefones_usuario_id ON telefones(usuario_id);
CREATE INDEX idx_telefones_is_whatsapp ON telefones(is_whatsapp);
CREATE INDEX idx_telefones_is_primary ON telefones(is_primary);

ALTER TABLE telefones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "telefones_select_own" ON telefones
    FOR SELECT
    USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "telefones_insert_own" ON telefones
    FOR INSERT
    WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "telefones_update_own" ON telefones
    FOR UPDATE
    USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "telefones_delete_own" ON telefones
    FOR DELETE
    USING (usuario_id::text = auth.uid()::text);

-- Cars
DROP TABLE IF EXISTS cars CASCADE;
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    modelo_veiculo VARCHAR(255) NOT NULL,
    cor VARCHAR(100),
    placa VARCHAR(7) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cars_usuario_id ON cars(usuario_id);
CREATE INDEX idx_cars_placa ON cars(placa);
CREATE INDEX idx_cars_is_default ON cars(is_default);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_select_own" ON cars
    FOR SELECT
    USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "cars_insert_own" ON cars
    FOR INSERT
    WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "cars_update_own" ON cars
    FOR UPDATE
    USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "cars_delete_own" ON cars
    FOR DELETE
    USING (usuario_id::text = auth.uid()::text);

-- Agendamentos
DROP TABLE IF EXISTS agendamentos CASCADE;
CREATE TABLE agendamentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
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

CREATE INDEX idx_agendamentos_usuario_id ON agendamentos(usuario_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(data);
CREATE INDEX idx_agendamentos_horario ON agendamentos(horario);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_placa ON agendamentos(placa);
CREATE INDEX idx_agendamentos_servico_id ON agendamentos(servico_id);

ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agendamentos_select_own" ON agendamentos
    FOR SELECT
    USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "agendamentos_insert_own" ON agendamentos
    FOR INSERT
    WITH CHECK (usuario_id::text = auth.uid()::text);

CREATE POLICY "agendamentos_update_own" ON agendamentos
    FOR UPDATE
    USING (usuario_id::text = auth.uid()::text);

CREATE POLICY "agendamentos_delete_own" ON agendamentos
    FOR DELETE
    USING (usuario_id::text = auth.uid()::text);

-- Admins podem ver todos
CREATE POLICY "agendamentos_select_admin" ON agendamentos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

CREATE POLICY "agendamentos_update_admin" ON agendamentos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- =============================================
-- COMENTÁRIOS
-- =============================================
COMMENT ON TABLE usuarios IS 'Usuários do sistema';
COMMENT ON COLUMN usuarios.id IS 'ID sequencial do usuário';
COMMENT ON COLUMN usuarios.role IS 'Papel do usuário: user ou admin';

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT
    'usuarios' as table_name,
    COUNT(*) as row_count
FROM usuarios
UNION ALL
SELECT 'telefones', COUNT(*) FROM telefones
UNION ALL
SELECT 'cars', COUNT(*) FROM cars
UNION ALL
SELECT 'agendamentos', COUNT(*) FROM agendamentos;
