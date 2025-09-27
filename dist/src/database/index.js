"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.checkConnection = checkConnection;
exports.queryWithRetry = queryWithRetry;
// src/database/index.ts - VERSÃO SIMPLIFICADA PARA VERCEL
const pg_1 = __importDefault(require("pg"));
require("dotenv/config");
const { Pool } = pg_1.default;
// ✅ POOL SIMPLIFICADO - mesmo do app.ts
exports.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
// Eventos do pool
exports.pool.on("error", (err, client) => {
    console.error("🔴 Erro inesperado no pool de conexão:", err);
    console.error("Cliente:", client?.processID || "desconhecido");
});
exports.pool.on("connect", (client) => {
    console.log("🟢 Nova conexão estabelecida:", client.processID);
});
// ✅ CLASSE DATABASE COMO EXPORTAÇÃO PADRÃO
class Database {
    constructor() {
        this.pool = exports.pool;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async query(text, params) {
        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Query executada:', {
                    text: text.replace(/\s+/g, ' ').trim(),
                    duration: `${duration}ms`,
                    rows: result.rowCount
                });
            }
            return result;
        }
        catch (error) {
            console.error('❌ Erro na query:', error);
            throw error;
        }
    }
    async getClient() {
        return this.pool.connect();
    }
    async close() {
        try {
            await this.pool.end();
            console.log('📊 Pool de conexões fechado');
        }
        catch (error) {
            console.error('❌ Erro ao fechar pool:', error);
        }
    }
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async healthCheck() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT 1 as health');
            client.release();
            return {
                status: 'healthy',
                details: {
                    totalConnections: this.pool.totalCount,
                    idleConnections: this.pool.idleCount,
                    waitingConnections: this.pool.waitingCount
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: error
            };
        }
    }
}
// ✅ FUNÇÕES AUXILIARES
async function checkConnection() {
    let client;
    try {
        client = await exports.pool.connect();
        const result = await client.query("SELECT NOW() as now, version() as version");
        console.log("✅ Conexão com banco OK:", result.rows[0].now);
        return true;
    }
    catch (error) {
        const err = error;
        console.error("❌ Erro ao conectar com banco:", err.message);
        throw error;
    }
    finally {
        if (client)
            client.release();
    }
}
async function queryWithRetry(text, params, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        let client;
        try {
            client = await exports.pool.connect();
            const result = await client.query(text, params);
            return result;
        }
        catch (error) {
            const err = error;
            console.error(`❌ Erro na query (tentativa ${attempt}/${retries}):`, err.message);
            if (attempt === retries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        finally {
            if (client)
                client.release();
        }
    }
}
// ✅ EXPORTAÇÃO PADRÃO DA CLASSE
exports.default = Database;
//# sourceMappingURL=index.js.map