// src/database/index.js
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

let connectionString = process.env.DATABASE_URL || "";

// 1) garantir sslmode=require na URL
if (connectionString && !/sslmode=/i.test(connectionString)) {
    connectionString += (connectionString.includes("?") ? "&" : "?") + "sslmode=require";
}

// 2) decidir se precisa SSL (Supabase/DB_SSL=true)
const needsSSL =
    process.env.DB_SSL === "true" ||
    /supabase\.com/i.test(connectionString) ||
    /aws|gcp|azure|neon\.tech|render\.com/i.test(connectionString);

// 3) objeto SSL para o driver 'pg'
const ssl = needsSSL ? { rejectUnauthorized: false } : false;

// 4) paraquedas DEV: evita falha com cadeia autoassinada no Windows/proxy
if (needsSSL && process.env.NODE_ENV !== "production") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export const pool = new Pool({
    connectionString,
    ssl,
    keepAlive: true,
    max: 20, // Aumentado de 10 para 20
    min: 5,  // Mínimo de conexões mantidas
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000, // Timeout para conectar
    acquireTimeoutMillis: 60_000,    // Timeout para pegar conexão do pool
    createTimeoutMillis: 30_000,     // Timeout para criar nova conexão
    destroyTimeoutMillis: 5_000,     // Timeout para destruir conexão
    reapIntervalMillis: 1_000,       // Intervalo para verificar conexões idle
    createRetryIntervalMillis: 200,  // Intervalo entre tentativas de reconexão
});

// Melhor tratamento de erros
pool.on("error", (err, client) => {
    console.error("🔴 Erro inesperado no pool de conexão:", err);
    console.error("Cliente:", client?.processID || "desconhecido");
});

pool.on("connect", (client) => {
    console.log("🟢 Nova conexão estabelecida:", client.processID);
});

pool.on("acquire", (client) => {
    console.log("🔵 Conexão adquirida do pool:", client.processID);
});

pool.on("remove", (client) => {
    console.log("🟡 Conexão removida do pool:", client.processID);
});

export async function checkConnection() {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query("SELECT NOW() as now, version() as version");
        console.log("✅ Conexão com banco OK:", result.rows[0].now);
        return true;
    } catch (error) {
        console.error("❌ Erro ao conectar com banco:", error.message);
        throw error;
    } finally {
        if (client) client.release();
    }
}

// Função para executar queries com retry automático
export async function queryWithRetry(text, params, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            console.error(`❌ Erro na query (tentativa ${attempt}/${retries}):`, error.message);

            if (attempt === retries) {
                throw error;
            }

            // Aguarda antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } finally {
            if (client) client.release();
        }
    }
}