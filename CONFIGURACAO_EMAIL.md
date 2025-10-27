# Configuração do Sistema de Recuperação de Senha

Este guia explica como configurar o sistema de "Esqueci minha senha" usando Nodemailer com Gmail.

## 📋 Pré-requisitos

- Conta Gmail ativa
- Acesso às configurações de segurança do Google

## 🔧 Passo 1: Configurar App Password no Gmail

### 1.1. Habilitar Verificação em 2 Etapas

1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Vá em **Segurança**
3. Role até **Como fazer login no Google**
4. Clique em **Verificação em duas etapas**
5. Siga as instruções para habilitar

### 1.2. Gerar App Password

1. Após habilitar a verificação em 2 etapas, volte para **Segurança**
2. Clique em **Senhas de app** (pode estar em "Como fazer login no Google")
3. Faça login novamente se solicitado
4. Em "Selecionar app", escolha **Outro (nome personalizado)**
5. Digite um nome como "AlphaClean Backend"
6. Clique em **Gerar**
7. **Copie a senha de 16 caracteres** (sem espaços)

## 🔐 Passo 2: Configurar Variáveis de Ambiente

Edite o arquivo `.env` do backend:

```env
# Email Configuration (Nodemailer)
EMAIL_USER=seuemail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # App Password gerado (sem espaços na prática)

# Frontend URL (para links de recuperação)
FRONTEND_URL=http://localhost:3000  # Em produção: https://seudominio.com
```

**Importante:**
- `EMAIL_USER` = Seu email Gmail completo
- `EMAIL_PASSWORD` = A senha de 16 caracteres gerada (cole sem espaços)
- `FRONTEND_URL` = URL do seu frontend (localhost em dev, domínio em produção)

## 📊 Passo 3: Criar Tabela no Banco de Dados

Execute o script SQL no seu banco PostgreSQL:

```bash
psql -U seu_usuario -d seu_banco -f database/4_create_password_reset_tokens.sql
```

Ou execute manualmente o conteúdo do arquivo `4_create_password_reset_tokens.sql`.

## ✅ Passo 4: Testar o Sistema

### 4.1. Inicie o Backend

```bash
cd AlphaClean-BackendReservation
npm run dev
```

### 4.2. Inicie o Frontend

```bash
cd AlphaClean
npm run dev
```

### 4.3. Teste o Fluxo

1. Acesse: [http://localhost:3000/login](http://localhost:3000/login)
2. Clique em **"Esqueci minha senha"**
3. Digite um email cadastrado
4. Verifique sua caixa de entrada (e spam)
5. Clique no link do email
6. Redefina sua senha
7. Faça login com a nova senha

## 🛠️ Endpoints da API

### POST `/api/auth/forgot-password`
Solicita reset de senha (envia email com token)

**Body:**
```json
{
  "email": "usuario@email.com"
}
```

**Resposta (200):**
```json
{
  "message": "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha."
}
```

### GET `/api/auth/verify-reset-token/:token`
Verifica se um token de reset é válido

**Resposta (200):**
```json
{
  "valid": true
}
```

### POST `/api/auth/reset-password`
Redefine a senha usando o token

**Body:**
```json
{
  "token": "abc123...",
  "newPassword": "novaSenhaSegura123"
}
```

**Resposta (200):**
```json
{
  "message": "Senha redefinida com sucesso! Você já pode fazer login com a nova senha."
}
```

## 🚨 Troubleshooting

### Erro: "Falha ao enviar email"

**Problema**: App Password incorreto ou não configurado

**Solução**:
1. Verifique se a verificação em 2 etapas está ativa
2. Gere um novo App Password
3. Cole no `.env` sem espaços
4. Reinicie o backend

### Erro: "Token inválido ou expirado"

**Problema**: Token com mais de 1 hora ou já utilizado

**Solução**:
- Tokens expiram em 1 hora por segurança
- Solicite um novo link de recuperação
- Cada token só pode ser usado uma vez

### Email não chega

**Possíveis causas**:
1. **Spam**: Verifique a pasta de spam/lixo eletrônico
2. **Email incorreto**: Verifique se o email está cadastrado corretamente
3. **Gmail bloqueado**: Verifique se não há bloqueios de segurança no Gmail
4. **Limite de envios**: Gmail permite ~500 emails/dia

## 📧 Customizar Template de Email

Edite o arquivo: `src/config/email.ts`

Função: `getPasswordResetEmailTemplate()`

Você pode personalizar:
- Cores do email
- Texto das mensagens
- Logo (adicione URL de imagem)
- Estilos CSS inline

## 🔒 Segurança

### Boas Práticas Implementadas

✅ Tokens únicos e aleatórios (32 bytes)
✅ Expiração de 1 hora
✅ Tokens de uso único (marcados como `used`)
✅ Mensagens genéricas (não revelam se email existe)
✅ Hash bcrypt nas senhas
✅ Logs de auditoria

### Limpeza de Tokens Antigos

Execute periodicamente (recomendado: cron job diário):

```sql
SELECT clean_expired_password_reset_tokens();
```

Ou configure um cron job:

```bash
# Limpar tokens expirados todos os dias às 3h
0 3 * * * psql -U seu_usuario -d seu_banco -c "SELECT clean_expired_password_reset_tokens();"
```

## 🎨 Frontend URLs

- **Esqueci minha senha**: `/esqueci-senha`
- **Redefinir senha**: `/redefinir-senha?token=ABC123`
- **Login**: `/login`

## 📝 Notas Importantes

1. **Produção**: Não comite o `.env` com credenciais reais
2. **Gmail**: Limite de 500 emails/dia no plano gratuito
3. **Alternativas**: Para volumes maiores, considere SendGrid ou AWS SES
4. **SSL**: Em produção, use HTTPS para segurança
5. **CORS**: Configure CORS no backend para permitir requisições do frontend

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs do backend (`console.log` e `console.error`)
2. Teste os endpoints com Postman/Insomnia
3. Verifique as configurações do Gmail
4. Confirme que as variáveis de ambiente estão corretas

---

**Desenvolvido com** ❤️ **por AlphaClean**
