"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// app.ts - COM MIDDLEWARES DE SEGURANÇA
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
console.log("🚀 Starting Alpha Clean Backend...");
console.log("📊 NODE_ENV:", process.env.NODE_ENV);
console.log("🌍 VERCEL:", process.env.VERCEL);
console.log("🔗 DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");
// ✅ IMPORTS DE SEGURANÇA
let securityMiddlewares;
try {
    console.log("📦 Loading security middlewares...");
    securityMiddlewares = require("./src/middlewares/security");
    console.log("✅ Security middlewares loaded");
}
catch (error) {
    console.error("❌ Failed to load security middlewares:", error);
}
// database
const index_1 = require("./src/database/index");
// rotas
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const agendamentoRoutes_1 = __importDefault(require("./src/routes/agendamentoRoutes"));
const servicoRoutes_1 = __importDefault(require("./src/routes/servicoRoutes"));
const servicesRoutes_1 = __importDefault(require("./src/routes/servicesRoutes"));
const adminRoutes_1 = __importDefault(require("./src/routes/adminRoutes"));
const whatsapp_1 = __importDefault(require("./src/routes/whatsapp"));
const carRoutes_1 = __importDefault(require("./src/routes/carRoutes"));
const reports_1 = __importDefault(require("./src/routes/reports"));
// services (WhatsApp será carregado dinamicamente)
const autoFinalizacaoService_1 = require("./src/services/autoFinalizacaoService");
// middlewares
const notFound_1 = __importDefault(require("./src/middlewares/notFound"));
const errorHandler_1 = __importDefault(require("./src/middlewares/errorHandler"));
// ===== CORS (com credenciais) =====
const DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3004",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3004",
    "https://alpha-clean-pearl.vercel.app"
];
const ENV_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...ENV_ORIGINS]));
const corsOptions = {
    origin(origin, cb) {
        if (!origin)
            return cb(null, true); // server-to-server / curl
        if (ALLOWED_ORIGINS.includes(origin || '')) {
            cb(null, true);
        }
        else {
            console.warn(`⚠️ Origin not allowed: ${origin}`);
            cb(null, false);
        }
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
// ===== App =====
const app = (0, express_1.default)();
app.set("trust proxy", 1); // Para funcionar atrás de proxy/load balancer
// ===== HEALTH CHECK (antes de qualquer middleware) =====
app.get("/", (req, res) => {
    try {
        res.status(200).json({
            status: "ok",
            message: "Alpha Clean Backend is running",
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || "development"
        });
    }
    catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({
            status: "error",
            message: "Server error in health check"
        });
    }
});
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});
app.get("/env-check", (req, res) => {
    res.json({
        status: "ok",
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: process.env.VERCEL,
            DATABASE_URL_SET: !!process.env.DATABASE_URL,
            DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + "...",
            CORS_ORIGINS_SET: !!process.env.CORS_ORIGINS,
            JWT_SECRET_SET: !!process.env.JWT_SECRET,
            WHATSAPP_SERVICE_URL_SET: !!process.env.WHATSAPP_SERVICE_URL
        },
        timestamp: new Date().toISOString()
    });
});
// ✅ MIDDLEWARES DE SEGURANÇA (ORDEM IMPORTANTE!)
// CORS deve vir PRIMEIRO, antes de outros headers
console.log("🌐 Applying CORS middleware...");
app.use((0, cors_1.default)(corsOptions));
console.log("✅ CORS middleware applied");
if (securityMiddlewares) {
    console.log("🔒 Applying security middlewares...");
    // 1. Helmet para headers de segurança padrão
    app.use(securityMiddlewares.helmetConfig);
    // 2. Headers de segurança personalizados
    app.use(securityMiddlewares.customSecurityHeaders);
    // 3. Rate limiting inteligente (aplica limiters específicos por rota)
    app.use(securityMiddlewares.smartRateLimiter);
    // 4. Logging de segurança
    app.use(securityMiddlewares.securityLogger);
    console.log("✅ Security middlewares applied");
}
else {
    console.log("⚠️ Skipping security middlewares (failed to load)");
}
// 6. Parser do body
app.use(express_1.default.json({
    limit: "1mb",
    // Verificação adicional de segurança
    verify: (req, res, buf) => {
        const body = buf.toString();
        // Detectar payloads suspeitos
        if (body.includes('<script') || body.includes('javascript:')) {
            throw new Error('Payload suspeito detectado');
        }
    }
}));
app.use(express_1.default.urlencoded({ extended: true, limit: "1mb" }));
// 7. Morgan para logs
app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// ===== ROTAS COM RATE LIMITING ESPECÍFICO =====
// Health checks (sem rate limiting)
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        security: {
            helmet: "enabled",
            rateLimit: "enabled",
            cors: "enabled"
        }
    });
});
app.get("/ping", async (req, res) => {
    try {
        console.log("🔍 Ping endpoint called");
        console.log("🔍 DATABASE_URL set:", !!process.env.DATABASE_URL);
        console.log("🔍 Attempting database query...");
        const result = await index_1.pool.query("SELECT NOW() as current_time");
        console.log("✅ Database query successful");
        res.json({
            status: "ok",
            database: "connected",
            timestamp: result.rows[0].current_time
        });
    }
    catch (error) {
        console.error("❌ Erro ao conectar no banco:", error);
        console.error("❌ Error stack:", error instanceof Error ? error.stack : String(error));
        res.status(500).json({
            status: "error",
            database: "disconnected",
            error: error instanceof Error ? error.message : "Database connection failed",
            details: {
                databaseUrlSet: !!process.env.DATABASE_URL,
                nodeEnv: process.env.NODE_ENV
            }
        });
    }
});
// Handle OPTIONS requests (CORS preflight)
app.options('*', (req, res) => {
    res.status(200).end();
});
// ===== ROTAS COM RATE LIMITING APLICADO =====
// O smartRateLimiter aplica automaticamente o limiter correto baseado na rota:
// - /auth/login, /auth/register → authLimiter (5 req/15min)
// - POST /api/* → createLimiter (10 req/10min)
// - /agendamentos/slots → slotsLimiter (30 req/5min)
// - /api/* → apiLimiter (60 req/min)
// - Demais rotas → generalLimiter (100 req/15min)
app.use("/auth", authRoutes_1.default);
app.use("/admin", adminRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/agendamentos", agendamentoRoutes_1.default);
app.use("/api/servicos", servicoRoutes_1.default);
app.use("/api/services", servicesRoutes_1.default);
app.use("/api/whatsapp", whatsapp_1.default);
app.use("/api/cars", carRoutes_1.default);
app.use("/api/reports", reports_1.default);
// ===== MIDDLEWARES DE ERRO =====
app.use(notFound_1.default);
app.use(errorHandler_1.default);
// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    try {
        (0, autoFinalizacaoService_1.stopAutoFinalizacao)();
        await index_1.pool.end();
    }
    catch (error) {
        console.error('Error closing pool:', error);
    }
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    try {
        (0, autoFinalizacaoService_1.stopAutoFinalizacao)();
        await index_1.pool.end();
    }
    catch (error) {
        console.error('Error closing pool:', error);
    }
    process.exit(0);
});
// ===== START SERVER (only in non-serverless environments) =====
if (process.env.VERCEL !== '1' && !module.parent) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, async () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`🔒 Segurança: Helmet + Rate Limiting habilitados`);
        console.log(`🌍 CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
        console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        // WhatsApp será inicializado via admin panel
        console.log('📱 WhatsApp disponível via admin panel');
        // Iniciar serviço de auto-finalização de agendamentos
        (0, autoFinalizacaoService_1.startAutoFinalizacao)();
    });
}
exports.default = app;
//# sourceMappingURL=app.js.map