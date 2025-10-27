# 📧 Como Configurar Email - Guia Rápido

## ✅ Já adicionei as variáveis no `.env`!

O arquivo `.env` do backend já está preparado. Agora você só precisa:

## 🔐 Passo 1: Gerar App Password no Gmail (5 minutos)

### 1.1. Ativar Verificação em 2 Etapas

1. **Acesse**: https://myaccount.google.com/security
2. Na seção **"Como fazer login no Google"**, clique em **"Verificação em duas etapas"**
3. Clique em **"Começar"**
4. Siga os passos (vai pedir para confirmar com seu celular)
5. Pronto! Verificação em 2 etapas ativada ✅

### 1.2. Gerar Senha de App

1. **Volte para**: https://myaccount.google.com/security
2. Na seção **"Como fazer login no Google"**, procure por **"Senhas de app"**
   - Se não aparecer, procure por "App passwords" ou acesse direto: https://myaccount.google.com/apppasswords
3. Faça login novamente se solicitado
4. Em **"Selecionar app"**, escolha **"Outro (nome personalizado)"**
5. Digite: **AlphaClean Backend**
6. Clique em **"Gerar"**
7. **COPIE A SENHA DE 16 CARACTERES** que apareceu
   - Exemplo: `abcd efgh ijkl mnop`
   - ⚠️ Copie sem os espaços: `abcdefghijklmnop`

## ✏️ Passo 2: Editar o arquivo `.env`

Abra o arquivo: `AlphaClean-BackendReservation\.env`

Encontre estas linhas (no final do arquivo):

```env
# Email Configuration (Nodemailer - Gmail)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-app-password-aqui
FRONTEND_URL=http://localhost:3000
```

**Substitua por:**

```env
# Email Configuration (Nodemailer - Gmail)
EMAIL_USER=leonardo.franca@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
FRONTEND_URL=http://localhost:3000
```

⚠️ **Importante:**
- `EMAIL_USER` = Seu email Gmail completo
- `EMAIL_PASSWORD` = A senha de 16 caracteres (cole SEM ESPAÇOS)
- `FRONTEND_URL` = Deixe `http://localhost:3000` (em produção mude para o domínio real)

## 💾 Passo 3: Salvar e Reiniciar

1. **Salve** o arquivo `.env` (Ctrl+S)
2. **Reinicie o backend**:
   ```bash
   # Se estiver rodando, pare (Ctrl+C) e inicie novamente:
   cd AlphaClean-BackendReservation
   npm run dev
   ```

## 🧪 Passo 4: Testar

1. Abra o frontend: http://localhost:3000/login
2. Clique em **"Esqueci minha senha"**
3. Digite seu email
4. Clique em **"Enviar Link de Recuperação"**
5. **Verifique sua caixa de entrada** (e spam!)
6. Clique no link do email
7. Redefina sua senha

## ❓ Problemas Comuns

### "Erro ao enviar email"

**Causa**: App Password incorreto ou verificação em 2 etapas não ativada

**Solução**:
1. Verifique se copiou a senha SEM espaços
2. Gere um novo App Password
3. Certifique-se que a verificação em 2 etapas está ativa

### "Token inválido"

**Causa**: Token expirou (válido por 1 hora)

**Solução**:
- Solicite um novo link de recuperação

### Email não chega

**Verifique**:
1. ✅ Pasta de SPAM
2. ✅ Email digitado está correto
3. ✅ Backend está rodando (`npm run dev`)
4. ✅ Variáveis do `.env` estão corretas

## 📝 Checklist Final

- [ ] Verificação em 2 etapas ativada no Gmail
- [ ] App Password gerada (16 caracteres)
- [ ] `.env` atualizado com EMAIL_USER e EMAIL_PASSWORD
- [ ] Backend reiniciado
- [ ] Testei o fluxo completo

## 🎉 Pronto!

Seu sistema de recuperação de senha está funcionando!

**Limites do Gmail Gratuito:**
- 500 emails por dia
- Suficiente para começar!
- Se precisar de mais, considere SendGrid ou AWS SES

---

**Dúvidas?** Verifique os logs do backend no terminal!
