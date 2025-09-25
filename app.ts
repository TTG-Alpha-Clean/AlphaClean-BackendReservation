// app.ts - COM MIDDLEWARES DE SEGURANÇA
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

// ✅ IMPORTS DE SEGURANÇA
import {
    helmetConfig,
    generalLimiter,
    authLimiter,
    securityLogger,
    customSecurityHeaders,
    smartRateLimiter
} from "./src/middlewares/security";

import cookieParser from "./src/middlewares/cookieParser";
import { pool } from "./src/database/index";

// rotas
import authRoutes from "./src/routes/authRoutes";
import userRoutes from "./src/routes/userRoutes";
import agendamentosRoutes from "./src/routes/agendamentoRoutes";
import servicosRoutes from "./src/routes/servicoRoutes";

// middlewares
import notFound from "./src/middlewares/notFound";
import errorHandler from "./src/middlewares/errorHandler";

// ===== CORS (com credenciais) =====
const DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
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
    credentials: true,
};

// ===== App =====
const app = express();
app.set("trust proxy", 1); // Para funcionar atrás de proxy/load balancer

// ✅ MIDDLEWARES DE SEGURANÇA (ORDEM IMPORTANTE!)
// 1. Headers de segurança personalizados (primeiro)
app.use(customSecurityHeaders);

// 2. Helmet para headers de segurança padrão
app.use(helmetConfig);

// 3. CORS
app.use(cors(corsOptions));

// 4. Rate limiting geral
app.use(generalLimiter);

// 5. Logging de segurança
app.use(securityLogger);

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

// 8. Cookie parser
app.use(cookieParser());

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
        const result = await pool.query("SELECT NOW()");
        res.json({
            status: "ok",
            database: "connected",
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error("Erro ao conectar no banco:", error);
        res.status(500).json({
            status: "error",
            database: "disconnected",
            error: "Database connection failed"
        });
    }
});

// Auth routes com rate limiting específico
app.use("/auth", authLimiter, authRoutes);

// API routes com rate limiting inteligente
app.use("/api/users", smartRateLimiter, userRoutes);
app.use("/api/agendamentos", smartRateLimiter, agendamentosRoutes);
app.use("/api/servicos", smartRateLimiter, servicosRoutes);

// ===== MIDDLEWARES DE ERRO =====
app.use(notFound);
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    await pool.end();
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

export default app;