// app.ts
import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Database
import { pool, checkConnection } from './src/database/index';

// Routes
import authRoutes from './src/routes/authRoutes';
import userRoutes from './src/routes/userRoutes';
import agendamentosRoutes from './src/routes/agendamentoRoutes';
import servicosRoutes from './src/routes/servicoRoutes';

// Middlewares
import notFound from './src/middlewares/notFound';
import errorHandler from './src/middlewares/errorHandler';

// CORS Configuration
const DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const ENV_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...ENV_ORIGINS]));

const corsOptions = {
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true); // server-to-server / curl
        callback(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
};

// App Creation
const app: Application = express();
app.set("trust proxy", 1);

// Middlewares
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agendamentos", agendamentosRoutes);
app.use("/api/servicos", servicosRoutes);

// Health Check
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Ping Database
app.get("/ping", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send(`Banco conectado! Hora atual: ${result.rows[0].now}`);
    } catch (error) {
        console.error("Erro ao conectar no banco:", error);
        res.status(500).send("Erro ao conectar no banco de dados.");
    }
});

// Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Test database connection
        await checkConnection();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📡 CORS habilitado para: ${ALLOWED_ORIGINS.join(', ')}`);
            console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();

export default app;