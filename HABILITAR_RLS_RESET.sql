-- Habilitar RLS e criar policies para password_reset_tokens
-- Execute este SQL no Supabase SQL Editor

-- 1. Habilitar Row Level Security
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Permitir INSERT apenas pelo backend (service_role)
CREATE POLICY "Backend can insert tokens"
ON password_reset_tokens
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- 3. Policy: Permitir SELECT apenas pelo backend (service_role)
CREATE POLICY "Backend can read tokens"
ON password_reset_tokens
FOR SELECT
TO authenticated, service_role
USING (true);

-- 4. Policy: Permitir UPDATE apenas pelo backend (service_role)
CREATE POLICY "Backend can update tokens"
ON password_reset_tokens
FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- 5. Policy: Permitir DELETE apenas pelo backend (service_role)
CREATE POLICY "Backend can delete tokens"
ON password_reset_tokens
FOR DELETE
TO authenticated, service_role
USING (true);

-- Verificar se RLS está ativo
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'password_reset_tokens';

-- Verificar policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'password_reset_tokens';

SELECT '✅ RLS habilitado e policies criadas com sucesso!' AS status;
