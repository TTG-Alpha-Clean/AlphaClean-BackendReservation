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
    max: 10,
    idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
    console.error("Erro no pool do banco:", err);
});

export async function checkConnection() {
    const client = await pool.connect();
    try {
        await client.query("select 1");
        return true;
    } finally {
        client.release();
    }
}
