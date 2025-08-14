// app.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import cookieParser from "./src/middlewares/cookieParser.js";
import { pool } from "./src/database/index.js";

// rotas
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import agendamentosRoutes from "./src/routes/agendamentoRoutes.js";

// middlewares
import notFound from "./src/middlewares/notFound.js";
import errorHandler from "./src/middlewares/errorHandler.js";


// ===== CORS (com credenciais) =====
const DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
const ENV_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ORIGINS, ...ENV_ORIGINS]));

const corsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true); // server-to-server / curl
        cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
};

// ===== App =====
const app = express();
app.set("trust proxy", 1);

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// cookies (nosso parser interno)
app.use(cookieParser());

// ===== Rotas =====
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/agendamentos", agendamentosRoutes);

app.use(notFound);
app.use(errorHandler);

// Health
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        ts: new Date().toISOString(),
    });
});

// Ping DB
app.get("/ping", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send(`Banco conectado! Hora atual: ${result.rows[0].now}`);
    } catch (error) {
        console.error("Erro ao conectar no banco:", error);
        res.status(500).send("Erro ao conectar no banco de dados.");
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;
