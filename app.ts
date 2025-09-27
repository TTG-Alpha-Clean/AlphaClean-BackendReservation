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

// services (WhatsApp será carregado dinamicamente)

// middlewares
import notFound from "./src/middlewares/notFound";
import errorHandler from "./src/middlewares/errorHandler";

// ===== CORS (com credenciais) =====
const DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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
        cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: false,
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
if (securityMiddlewares) {
    console.log("🔒 Applying security middlewares...");
    // 1. Headers de segurança personalizados (primeiro)
    app.use(securityMiddlewares.customSecurityHeaders);

    // 2. Helmet para headers de segurança padrão
    app.use(securityMiddlewares.helmetConfig);

    // 3. CORS
    app.use(cors(corsOptions));

    // 4. Rate limiting geral
    app.use(securityMiddlewares.generalLimiter);

    // 5. Logging de segurança
    app.use(securityMiddlewares.securityLogger);
    console.log("✅ Security middlewares applied");
} else {
    console.log("⚠️ Skipping security middlewares (failed to load)");
    app.use(cors(corsOptions));
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

// Auth routes (rate limiting desabilitado temporariamente para testes)
app.use("/auth", authRoutes);

// Admin routes (rate limiting desabilitado temporariamente para testes)
app.use("/admin", adminRoutes);

// API routes (rate limiting desabilitado temporariamente para testes)
app.use("/api/users", userRoutes);
app.use("/api/agendamentos", agendamentosRoutes);
app.use("/api/servicos", servicosRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// ===== MIDDLEWARES DE ERRO =====
app.use(notFound);
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    try {
        await pool.end();
    } catch (error) {
        console.error('Error closing pool:', error);
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    try {
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
    });
}

export default app;