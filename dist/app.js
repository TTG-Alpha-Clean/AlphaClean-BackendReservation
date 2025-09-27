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
// ✅ IMPORTS DE SEGURANÇA E BANCO
let securityMiddlewares;
let pool;
try {
    console.log("📦 Loading security middlewares...");
    securityMiddlewares = require("./src/middlewares/security");
    console.log("✅ Security middlewares loaded");
}
catch (error) {
    console.error("❌ Failed to load security middlewares:", error);
}
try {
    console.log("🗄️ Loading database connection...");
    console.log("🔍 DATABASE_URL available:", !!process.env.DATABASE_URL);
    console.log("🔍 DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 20) + "...");
    const dbModule = require("./src/database/index");
    pool = dbModule.pool;
    console.log("✅ Database connection loaded");
    console.log("🔍 Pool object:", !!pool);
}
catch (error) {
    console.error("❌ Failed to load database connection:", error);
    console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
}
// rotas
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const agendamentoRoutes_1 = __importDefault(require("./src/routes/agendamentoRoutes"));
const servicoRoutes_1 = __importDefault(require("./src/routes/servicoRoutes"));
const servicesRoutes_1 = __importDefault(require("./src/routes/servicesRoutes"));
const adminRoutes_1 = __importDefault(require("./src/routes/adminRoutes"));
const whatsapp_1 = __importDefault(require("./src/routes/whatsapp"));
// services (WhatsApp será carregado dinamicamente)
// middlewares
const notFound_1 = __importDefault(require("./src/middlewares/notFound"));
const errorHandler_1 = __importDefault(require("./src/middlewares/errorHandler"));
// ===== CORS (com credenciais) =====
const DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const ENV_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...ENV_ORIGINS]));
const corsOptions = {
    origin(origin, cb) {
        if (!origin)
            return cb(null, true); // server-to-server / curl
        cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: false,
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
if (securityMiddlewares) {
    console.log("🔒 Applying security middlewares...");
    // 1. Headers de segurança personalizados (primeiro)
    app.use(securityMiddlewares.customSecurityHeaders);
    // 2. Helmet para headers de segurança padrão
    app.use(securityMiddlewares.helmetConfig);
    // 3. CORS
    app.use((0, cors_1.default)(corsOptions));
    // 4. Rate limiting geral
    app.use(securityMiddlewares.generalLimiter);
    // 5. Logging de segurança
    app.use(securityMiddlewares.securityLogger);
    console.log("✅ Security middlewares applied");
}
else {
    console.log("⚠️ Skipping security middlewares (failed to load)");
    app.use((0, cors_1.default)(corsOptions));
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
        console.log("🔍 Pool available:", !!pool);
        console.log("🔍 DATABASE_URL set:", !!process.env.DATABASE_URL);
        if (!pool) {
            throw new Error("Database pool not initialized");
        }
        console.log("🔍 Attempting database query...");
        const result = await pool.query("SELECT NOW()");
        console.log("✅ Database query successful");
        res.json({
            status: "ok",
            database: "connected",
            timestamp: result.rows[0].now
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
                poolAvailable: !!pool,
                databaseUrlSet: !!process.env.DATABASE_URL
            }
        });
    }
});
// Auth routes (rate limiting desabilitado temporariamente para testes)
app.use("/auth", authRoutes_1.default);
// Admin routes (rate limiting desabilitado temporariamente para testes)
app.use("/admin", adminRoutes_1.default);
// API routes (rate limiting desabilitado temporariamente para testes)
app.use("/api/users", userRoutes_1.default);
app.use("/api/agendamentos", agendamentoRoutes_1.default);
app.use("/api/servicos", servicoRoutes_1.default);
app.use("/api/services", servicesRoutes_1.default);
app.use("/api/whatsapp", whatsapp_1.default);
// ===== MIDDLEWARES DE ERRO =====
app.use(notFound_1.default);
app.use(errorHandler_1.default);
// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    if (pool) {
        await pool.end();
    }
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    if (pool) {
        await pool.end();
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
    });
}
exports.default = app;
//# sourceMappingURL=app.js.map