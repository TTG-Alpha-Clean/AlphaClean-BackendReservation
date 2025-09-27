// src/database/index.ts - VERSÃO SIMPLIFICADA PARA VERCEL
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// ✅ POOL SIMPLIFICADO - mesmo do app.ts
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Eventos do pool
pool.on("error", (err: Error, client: any) => {
    console.error("🔴 Erro inesperado no pool de conexão:", err);
    console.error("Cliente:", client?.processID || "desconhecido");
});

pool.on("connect", (client: any) => {
    console.log("🟢 Nova conexão estabelecida:", client.processID);
});

// ✅ CLASSE DATABASE COMO EXPORTAÇÃO PADRÃO
class Database {
    private static instance: Database;
    public pool: pg.Pool;

    constructor() {
        this.pool = pool;
    }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async query(text: string, params?: any[]): Promise<pg.QueryResult> {
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
        } catch (error) {
            console.error('❌ Erro na query:', error);
            throw error;
        }
    }

    async getClient(): Promise<pg.PoolClient> {
        return this.pool.connect();
    }

    async close(): Promise<void> {
        try {
            await this.pool.end();
            console.log('📊 Pool de conexões fechado');
        } catch (error) {
            console.error('❌ Erro ao fechar pool:', error);
        }
    }

    async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
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
        } catch (error) {
            return {
                status: 'unhealthy',
                details: error
            };
        }
    }
}

// ✅ FUNÇÕES AUXILIARES
export async function checkConnection(): Promise<boolean> {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query("SELECT NOW() as now, version() as version");
        console.log("✅ Conexão com banco OK:", result.rows[0].now);
        return true;
    } catch (error) {
        const err = error as Error;
        console.error("❌ Erro ao conectar com banco:", err.message);
        throw error;
    } finally {
        if (client) client.release();
    }
}

export async function queryWithRetry(text: string, params?: any[], retries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        let client;
        try {
            client = await pool.connect();
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            const err = error as Error;
            console.error(`❌ Erro na query (tentativa ${attempt}/${retries}):`, err.message);

            if (attempt === retries) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } finally {
            if (client) client.release();
        }
    }
}

// ✅ EXPORTAÇÃO PADRÃO DA CLASSE
export default Database;