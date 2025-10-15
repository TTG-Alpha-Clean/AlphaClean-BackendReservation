# Criar Usuário Admin via Backend

⚠️ **Execute APENAS DEPOIS dos outros 2 SQLs**

## Passo 1: Registrar o usuário

Execute esta requisição via Thunder Client, Postman ou curl:

```bash
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "nome": "Administrador Alpha Clean",
  "email": "admin@alphaclean.com",
  "senha": "admin123",
  "ddd": "11",
  "numero": "999999999"
}
```

## Passo 2: Transformar em admin

Depois de criar o usuário, execute este SQL no Supabase:

```sql
UPDATE usuarios
SET role = 'admin'
WHERE email = 'admin@alphaclean.com';
```

## Passo 3: Verificar

```sql
SELECT id, nome, email, role, created_at
FROM usuarios
WHERE email = 'admin@alphaclean.com';
```

## Credenciais

- **Email**: admin@alphaclean.com
- **Senha**: admin123
- **Role**: admin

---

## Alternativa 1: PowerShell (Windows) - RECOMENDADO

Abra o PowerShell e execute:

```powershell
$body = @{
    nome = "Administrador Alpha Clean"
    email = "admin@alphaclean.com"
    senha = "admin123"
    ddd = "11"
    numero = "999999999"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method POST -Body $body -ContentType "application/json"
```

## Alternativa 2: curl no PowerShell (Windows)

```powershell
curl.exe -X POST http://localhost:3001/auth/register -H "Content-Type: application/json" -d '{\"nome\":\"Administrador Alpha Clean\",\"email\":\"admin@alphaclean.com\",\"senha\":\"admin123\",\"ddd\":\"11\",\"numero\":\"999999999\"}'
```

## Alternativa 3: CMD (Windows)

```cmd
curl -X POST http://localhost:3001/auth/register -H "Content-Type: application/json" -d "{\"nome\":\"Administrador Alpha Clean\",\"email\":\"admin@alphaclean.com\",\"senha\":\"admin123\",\"ddd\":\"11\",\"numero\":\"999999999\"}"
```
