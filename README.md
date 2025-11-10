# AlphaClean - Backend API

API RESTful para o sistema de gerenciamento de agendamentos AlphaClean, construída com Node.js, Express e TypeScript.

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Configuração](#configuração)
- [Endpoints da API](#endpoints-da-api)
- [Autenticação](#autenticação)
- [Segurança](#segurança)
- [Database](#database)
- [Serviços Automáticos](#serviços-automáticos)
- [Deploy](#deploy)
- [Contribuindo](#contribuindo)

## Sobre o Projeto

Backend completo para o sistema AlphaClean, fornecendo APIs para gerenciamento de usuários, agendamentos, serviços, veículos e integração com WhatsApp. A API é projetada com foco em segurança, escalabilidade e performance.

## Tecnologias

### Core

- **Runtime**: [Node.js](https://nodejs.org/) >= 18.0.0
- **Framework**: [Express.js](https://expressjs.com/) 4.18.2
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) 5.1.6
- **Database**: [PostgreSQL](https://www.postgresql.org/) com [pg](https://node-postgres.com/)

### Segurança

- **Autenticação**: [JWT](https://jwt.io/) (jsonwebtoken)
- **Hash de Senhas**: [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Headers de Segurança**: [Helmet](https://helmetjs.github.io/)
- **Rate Limiting**: [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- **CORS**: [cors](https://www.npmjs.com/package/cors)

### Funcionalidades

- **WhatsApp**: [whatsapp-web.js](https://wwebjs.dev/)
- **Upload de Arquivos**: [Multer](https://www.npmjs.com/package/multer) + [Cloudinary](https://cloudinary.com/)
- **Agendamento de Tarefas**: [node-cron](https://www.npmjs.com/package/node-cron)
- **Email**: [Nodemailer](https://nodemailer.com/)
- **Logging**: [Morgan](https://www.npmjs.com/package/morgan)

### Development

- **Dev Server**: [ts-node-dev](https://www.npmjs.com/package/ts-node-dev)
- **Testing**: [Jest](https://jestjs.io/) + [ts-jest](https://www.npmjs.com/package/ts-jest)
- **Environment Variables**: [dotenv](https://www.npmjs.com/package/dotenv)

## Arquitetura

O projeto segue uma arquitetura em camadas (Layered Architecture):

```
┌─────────────────────────────────────┐
│         Controllers Layer           │  ← Requisições HTTP
├─────────────────────────────────────┤
│         Services Layer              │  ← Lógica de Negócio
├─────────────────────────────────────┤
│         Database Layer              │  ← Acesso aos Dados
└─────────────────────────────────────┘
```

### Padrões de Design

- **MVC Pattern**: Controllers, Services e Models separados
- **Dependency Injection**: Serviços injetados nos controllers
- **Error Handling**: Middleware centralizado de tratamento de erros
- **Async/Await**: Handlers assíncronos com wrapper de erros
- **Type Safety**: TypeScript em todo o código

## Estrutura do Projeto

```
AlphaClean-BackendReservation/
├── database/                        # Scripts SQL
│   ├── 1_create_tables.sql         # Tabelas principais
│   ├── 2_create_policies.sql       # Políticas RLS
│   ├── 3_create_functions.sql      # Funções do banco
│   └── 4_create_password_reset_tokens.sql
├── dist/                           # Build de produção
├── scripts/                        # Scripts utilitários
│   ├── createAdmin.ts             # Criar usuários admin
│   ├── checkRole.ts               # Verificar e alterar roles
│   └── debugLogin.ts              # Debug de autenticação
├── src/
│   ├── config/                    # Configurações
│   │   ├── cloudinary.ts         # Config Cloudinary
│   │   └── email.ts              # Config Email
│   ├── controllers/              # Controllers (lógica de requisição)
│   │   ├── adminControllers.ts   # Admin operations
│   │   ├── agendamentoController.ts
│   │   ├── authController.ts     # Login/Register
│   │   ├── carController.ts      # Veículos
│   │   ├── healthCheckController.ts
│   │   ├── passwordResetController.ts
│   │   ├── reportController.ts   # Relatórios
│   │   ├── servicoController.ts
│   │   ├── servicesController.ts
│   │   └── userController.ts
│   ├── database/                 # Database connection
│   │   └── index.ts             # Pool de conexões
│   ├── middlewares/             # Middlewares Express
│   │   ├── auth.ts             # Autenticação JWT
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── notFound.ts         # 404 handler
│   │   ├── security.ts         # Security middlewares
│   │   └── upload.ts           # Upload de arquivos
│   ├── routes/                 # Definição de rotas
│   │   ├── adminRoutes.ts
│   │   ├── agendamentoRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── carRoutes.ts
│   │   ├── indexRoutes.ts
│   │   ├── reports.ts
│   │   ├── servicoRoutes.ts
│   │   ├── servicesRoutes.ts
│   │   ├── userRoutes.ts
│   │   └── whatsapp.ts
│   ├── services/               # Lógica de negócio
│   │   ├── adminServices.ts
│   │   ├── agendamentoService.ts
│   │   ├── autoFinalizacaoService.ts  # Cron job
│   │   ├── carService.ts
│   │   ├── reportService.ts
│   │   ├── servicoService.ts
│   │   ├── servicesService.ts
│   │   ├── userService.ts
│   │   ├── whatsappClient.ts
│   │   └── whatsappService.ts
│   ├── types/                  # Tipos TypeScript
│   │   └── interfaces.ts
│   └── utils/                  # Funções utilitárias
│       ├── apiError.ts        # Classe de erro customizada
│       ├── asyncHandler.ts    # Wrapper async
│       ├── jwt.ts             # JWT helpers
│       ├── password.ts        # Hash de senhas
│       ├── scheduleConfig.ts  # Config de horários
│       ├── statusMachine.ts   # Máquina de estados
│       ├── userValidators.ts
│       └── validators.ts
├── .env                        # Variáveis de ambiente
├── app.ts                      # Configuração do Express
├── package.json
└── tsconfig.json              # Configuração TypeScript
```

## Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm ou yarn
- Conta no Cloudinary (para upload de imagens)

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/TTG-Alpha-Clean/AlphaClean-BackendReservation.git
cd AlphaClean-BackendReservation
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Crie um arquivo .env na raiz do projeto
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Configure o banco de dados:
```bash
# Execute os scripts SQL na ordem:
psql -U seu_usuario -d seu_banco -f database/1_create_tables.sql
psql -U seu_usuario -d seu_banco -f database/2_create_policies.sql
psql -U seu_usuario -d seu_banco -f database/3_create_functions.sql
psql -U seu_usuario -d seu_banco -f database/4_create_password_reset_tokens.sql
```

5. Crie um usuário administrador:
```bash
npm run create:admin
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

7. A API estará disponível em [http://localhost:3001](http://localhost:3001)

## Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia servidor de desenvolvimento com hot-reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm run start` - Inicia servidor de produção

### Testes
- `npm test` - Executa testes com Jest

### Database
- `npm run migrate` - Executa migrations
- `npm run seed` - Popula banco com dados de teste

### Utilidades
- `npm run create:admin` - Cria usuário administrador
- `npm run create:user` - Cria usuário cliente
- `npm run debug:login` - Debug de autenticação
- `npm run debug:users` - Lista todos os usuários
- `npm run check:role` - Verifica role de um usuário
- `npm run make:admin` - Transforma usuário em admin
- `npm run list:users` - Lista usuários com roles
- `npm run check:enum` - Verifica enums do banco

## Configuração

### Variáveis de Ambiente

```env
# Server
NODE_ENV=development
PORT=3001
VERCEL=0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/alphaclean

# JWT
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3004

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
EMAIL_FROM=noreply@alphaclean.com

# WhatsApp Service
WHATSAPP_SERVICE_URL=http://localhost:3002

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Descrição das Variáveis

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | Sim |
| `JWT_SECRET` | Chave secreta para tokens JWT | Sim |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | Não (padrão: 7d) |
| `PORT` | Porta do servidor | Não (padrão: 3001) |
| `CORS_ORIGINS` | Origins permitidas (separadas por vírgula) | Sim |
| `CLOUDINARY_*` | Credenciais Cloudinary | Sim (para upload) |
| `EMAIL_*` | Configurações de email | Sim (para recuperação de senha) |
| `WHATSAPP_SERVICE_URL` | URL do serviço WhatsApp | Não |

## Endpoints da API

### Autenticação

```
POST   /auth/register              # Registrar novo usuário
POST   /auth/login                 # Login
POST   /auth/forgot-password       # Solicitar reset de senha
POST   /auth/reset-password        # Resetar senha
GET    /auth/verify-token          # Verificar token de reset
```

### Usuários

```
GET    /api/users                  # Listar usuários (admin)
GET    /api/users/:id              # Buscar usuário por ID
PUT    /api/users/:id              # Atualizar usuário
DELETE /api/users/:id              # Deletar usuário (admin)
GET    /api/users/profile          # Perfil do usuário logado
PUT    /api/users/profile          # Atualizar perfil
```

### Agendamentos

```
GET    /api/agendamentos           # Listar agendamentos
POST   /api/agendamentos           # Criar agendamento
GET    /api/agendamentos/:id       # Buscar por ID
PUT    /api/agendamentos/:id       # Atualizar agendamento
DELETE /api/agendamentos/:id       # Cancelar agendamento
PATCH  /api/agendamentos/:id/status # Atualizar status
POST   /api/agendamentos/:id/complete # Finalizar serviço
```

### Serviços

```
GET    /api/services               # Listar serviços
POST   /api/services               # Criar serviço (admin)
GET    /api/services/:id           # Buscar por ID
PUT    /api/services/:id           # Atualizar serviço (admin)
DELETE /api/services/:id           # Deletar serviço (admin)
```

### Veículos

```
GET    /api/cars                   # Listar veículos do usuário
POST   /api/cars                   # Adicionar veículo
GET    /api/cars/:id               # Buscar por ID
PUT    /api/cars/:id               # Atualizar veículo
DELETE /api/cars/:id               # Deletar veículo
```

### Relatórios (Admin)

```
GET    /api/reports/dashboard      # Métricas do dashboard
GET    /api/reports/revenue        # Relatório de faturamento
GET    /api/reports/services       # Serviços mais populares
GET    /api/reports/customers      # Clientes mais frequentes
```

### WhatsApp (Admin)

```
GET    /api/whatsapp/status        # Status da conexão
POST   /api/whatsapp/start         # Iniciar WhatsApp
POST   /api/whatsapp/stop          # Parar WhatsApp
GET    /api/whatsapp/qr            # Obter QR Code
```

### Admin

```
GET    /admin/users                # Listar todos os usuários
PUT    /admin/users/:id/role       # Alterar role de usuário
DELETE /admin/users/:id            # Deletar usuário
GET    /admin/stats                # Estatísticas gerais
```

### Health Check

```
GET    /                           # Status da API
GET    /health                     # Health check
GET    /ping                       # Ping database
GET    /env-check                  # Verificar variáveis de ambiente
```

## Autenticação

A API utiliza **JWT (JSON Web Tokens)** para autenticação.

### Como Autenticar

1. **Registrar ou Login**:
```bash
POST /auth/login
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

2. **Resposta**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Usuário",
    "email": "usuario@email.com",
    "role": "cliente"
  }
}
```

3. **Usar o Token**:
```bash
GET /api/users/profile
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Roles de Usuário

- `cliente`: Usuário comum (pode criar agendamentos, gerenciar veículos)
- `admin`: Administrador (acesso completo ao sistema)

## Segurança

### Implementações de Segurança

1. **Helmet**: Headers de segurança HTTP
2. **Rate Limiting**: Proteção contra DDoS
   - Geral: 100 requisições por 15 minutos
   - Auth: 5 tentativas por 15 minutos
3. **CORS**: Controle de origens permitidas
4. **JWT**: Tokens com expiração
5. **Bcrypt**: Hash de senhas com salt
6. **Input Validation**: Validação de dados de entrada
7. **SQL Injection Protection**: Queries parametrizadas
8. **XSS Protection**: Sanitização de inputs

### Rate Limits

```typescript
// Geral
100 requisições / 15 minutos

// Autenticação
5 tentativas / 15 minutos

// Upload de arquivos
10 uploads / hora
```

## Database

### Schema Principal

**Tabelas**:
- `users` - Usuários do sistema
- `cars` - Veículos cadastrados
- `services` - Serviços oferecidos
- `appointments` - Agendamentos
- `password_reset_tokens` - Tokens de reset de senha

### Relacionamentos

```
users (1) ──── (N) cars
users (1) ──── (N) appointments
cars (1) ──── (N) appointments
services (1) ──── (N) appointments
```

### Row Level Security (RLS)

O banco utiliza PostgreSQL RLS para garantir que:
- Usuários só acessem seus próprios dados
- Admins tenham acesso completo
- Operações sejam auditadas

## Serviços Automáticos

### Auto-Finalização de Agendamentos

Serviço cron que roda a cada hora para:
- Verificar agendamentos "Em Andamento"
- Finalizar automaticamente após o tempo estimado + 1 hora
- Atualizar status para "Concluído"

```typescript
// Configuração em src/services/autoFinalizacaoService.ts
Cron: '0 * * * *' // A cada hora
```

### WhatsApp Integration

- Conexão via QR Code
- Envio automático de confirmações
- Notificações de status
- Lembretes de agendamento

## Deploy

### Vercel (Serverless)

1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático via Git push

### Heroku

```bash
heroku create alphaclean-api
heroku addons:create heroku-postgresql
heroku config:set JWT_SECRET=sua_chave
git push heroku main
```

### Docker

```dockerfile
# Dockerfile incluído no projeto
docker build -t alphaclean-backend .
docker run -p 3001:3001 alphaclean-backend
```

### VPS (Ubuntu)

```bash
# PM2 para gerenciamento de processo
npm install -g pm2
pm2 start dist/app.js --name alphaclean-api
pm2 startup
pm2 save
```

## Boas Práticas Implementadas

### Code Quality

- **TypeScript**: Type safety em todo o código
- **ESLint**: Linting configurado
- **Modular Structure**: Código organizado em camadas
- **Error Handling**: Tratamento centralizado de erros
- **Async/Await**: Código assíncrono limpo

### Performance

- **Connection Pooling**: Pool de conexões PostgreSQL
- **Caching**: Headers de cache configurados
- **Compression**: Gzip para responses
- **Lazy Loading**: Carregamento sob demanda

### Testing

- **Unit Tests**: Testes unitários com Jest
- **Integration Tests**: Testes de integração
- **API Tests**: Testes de endpoints

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Guidelines

- Siga os padrões TypeScript
- Adicione testes para novas features
- Atualize a documentação
- Use commits semânticos

## Troubleshooting

### Erro de Conexão com Database

```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -U usuario -d banco -h localhost
```

### Erro de Autenticação JWT

```bash
# Verificar se JWT_SECRET está configurado
npm run debug:login
```

### WhatsApp não conecta

```bash
# Limpar sessão do WhatsApp
rm -rf .wwebjs_auth/
npm run dev
```

## Licença

Este projeto é privado e proprietário da Alpha Clean.

## Desenvolvedores

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Leofrancaa">
        <img src="https://github.com/Leofrancaa.png" width="100px;" alt="Leonardo França"/><br />
        <sub><b>Leonardo França</b></sub>
      </a><br />
      <a href="https://github.com/Leofrancaa" title="GitHub">💻</a>
    </td>
    <td align="center">
      <a href="https://github.com/guissx">
        <img src="https://github.com/guissx.png" width="100px;" alt="Guilherme"/><br />
        <sub><b>Guilherme</b></sub>
      </a><br />
      <a href="https://github.com/guissx" title="GitHub">💻</a>
    </td>
    <td align="center">
      <a href="https://github.com/GustavoCunh4">
        <img src="https://github.com/GustavoCunh4.png" width="100px;" alt="Gustavo Cunha"/><br />
        <sub><b>Gustavo Cunha</b></sub>
      </a><br />
      <a href="https://github.com/GustavoCunh4" title="GitHub">💻</a>
    </td>
    <td align="center">
      <a href="https://github.com/GustavoD15">
        <img src="https://github.com/GustavoD15.png" width="100px;" alt="Gustavo Dias"/><br />
        <sub><b>Gustavo Dias</b></sub>
      </a><br />
      <a href="https://github.com/GustavoD15" title="GitHub">💻</a>
    </td>
    <td align="center">
      <a href="https://github.com/marialuizaqueiroz">
        <img src="https://github.com/marialuizaqueiroz.png" width="100px;" alt="Maria Luiza Queiroz"/><br />
        <sub><b>Maria Luiza Queiroz</b></sub>
      </a><br />
      <a href="https://github.com/marialuizaqueiroz" title="GitHub">💻</a>
    </td>
  </tr>
</table>

## Contato

**Alpha Clean Team** - [@TTG-Alpha-Clean](https://github.com/TTG-Alpha-Clean)

**Link do Projeto:** [AlphaClean-BackendReservation](https://github.com/TTG-Alpha-Clean/AlphaClean-BackendReservation)

---

<div align="center">

**Desenvolvido com 💙 por:**

[Leonardo Franca](https://github.com/Leofrancaa) • [Gustavo Cabral](https://github.com/guissx) • [Luiz Gustavo Cunha](https://github.com/GustavoCunh4) • [Gustavo Diniz](https://github.com/GustavoD15) • [Maria Luiza Queiroz](https://github.com/marialuizaqueiroz)

</div>
