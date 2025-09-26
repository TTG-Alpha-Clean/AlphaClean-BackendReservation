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
// ✅ IMPORTS DE SEGURANÇA
const security_1 = require("./src/middlewares/security");
const cookieParser_1 = __importDefault(require("./src/middlewares/cookieParser"));
const index_1 = require("./src/database/index");
// rotas
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./src/routes/userRoutes"));
const agendamentoRoutes_1 = __importDefault(require("./src/routes/agendamentoRoutes"));
const servicoRoutes_1 = __importDefault(require("./src/routes/servicoRoutes"));
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
    credentials: true,
};
// ===== App =====
const app = (0, express_1.default)();
app.set("trust proxy", 1); // Para funcionar atrás de proxy/load balancer
// ✅ MIDDLEWARES DE SEGURANÇA (ORDEM IMPORTANTE!)
// 1. Headers de segurança personalizados (primeiro)
app.use(security_1.customSecurityHeaders);
// 2. Helmet para headers de segurança padrão
app.use(security_1.helmetConfig);
// 3. CORS
app.use((0, cors_1.default)(corsOptions));
// 4. Rate limiting geral
app.use(security_1.generalLimiter);
// 5. Logging de segurança
app.use(security_1.securityLogger);
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
// 8. Cookie parser
app.use((0, cookieParser_1.default)());
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
        const result = await index_1.pool.query("SELECT NOW()");
        res.json({
            status: "ok",
            database: "connected",
            timestamp: result.rows[0].now
        });
    }
    catch (error) {
        console.error("Erro ao conectar no banco:", error);
        res.status(500).json({
            status: "error",
            database: "disconnected",
            error: "Database connection failed"
        });
    }
});
// Auth routes com rate limiting específico
app.use("/auth", security_1.authLimiter, authRoutes_1.default);
// API routes com rate limiting inteligente
app.use("/api/users", security_1.smartRateLimiter, userRoutes_1.default);
app.use("/api/agendamentos", security_1.smartRateLimiter, agendamentoRoutes_1.default);
app.use("/api/servicos", security_1.smartRateLimiter, servicoRoutes_1.default);
// ===== MIDDLEWARES DE ERRO =====
app.use(notFound_1.default);
app.use(errorHandler_1.default);
// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    await index_1.pool.end();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    await index_1.pool.end();
    process.exit(0);
});
// ===== START SERVER =====
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔒 Segurança: Helmet + Rate Limiting habilitados`);
    console.log(`🌍 CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map