// app.ts - COM MIDDLEWARES DE SEGURANÇA
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

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
} catch (error) {
    console.error("❌ Failed to load security middlewares:", error);
}

// database
import { pool } from "./src/database/index";

// rotas
import authRoutes from "./src/routes/authRoutes";
import userRoutes from "./src/routes/userRoutes";
import agendamentosRoutes from "./src/routes/agendamentoRoutes";
import servicosRoutes from "./src/routes/servicoRoutes";
import servicesRoutes from "./src/routes/servicesRoutes";
import adminRoutes from "./src/routes/adminRoutes";
import whatsappRoutes from "./src/routes/whatsapp";
import carRoutes from "./src/routes/carRoutes";
import reportRoutes from "./src/routes/reports";

// services (WhatsApp será carregado dinamicamente)
import { startAutoFinalizacao, stopAutoFinalizacao } from "./src/services/autoFinalizacaoService";

// middlewares
import notFound from "./src/middlewares/notFound";
import errorHandler from "./src/middlewares/errorHandler";

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
    origin(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return cb(null, true); // server-to-server / curl

        if (ALLOWED_ORIGINS.includes(origin || '')) {
            cb(null, true);
        } else {
            console.warn(`⚠️ Origin not allowed: ${origin}`);
            cb(null, false);
        }
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// ===== App =====
const app = express();
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
    } catch (error) {
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
app.use(cors(corsOptions));
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
} else {
    console.log("⚠️ Skipping security middlewares (failed to load)");
}

// 6. Parser do body
app.use(express.json({
    limit: "1mb",
    // Verificação adicional de segurança
    verify: (req: any, res, buf) => {
        const body = buf.toString();
        // Detectar payloads suspeitos
        if (body.includes('<script') || body.includes('javascript:')) {
            throw new Error('Payload suspeito detectado');
        }
    }
}));

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 7. Morgan para logs
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));


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
        const result = await pool.query("SELECT NOW() as current_time");
        console.log("✅ Database query successful");

        res.json({
            status: "ok",
            database: "connected",
            timestamp: result.rows[0].current_time
        });
    } catch (error) {
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

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agendamentos", agendamentosRoutes);
app.use("/api/servicos", servicosRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/reports", reportRoutes);

// ===== MIDDLEWARES DE ERRO =====
app.use(notFound);
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    try {
        stopAutoFinalizacao();
        await pool.end();
    } catch (error) {
        console.error('Error closing pool:', error);
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    try {
        stopAutoFinalizacao();
        await pool.end();
    } catch (error) {
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
        startAutoFinalizacao();
    });
}

export default app;