"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAutoFinalizacao = startAutoFinalizacao;
exports.stopAutoFinalizacao = stopAutoFinalizacao;
exports.executeAutoFinalizacao = executeAutoFinalizacao;
// src/services/autoFinalizacaoService.ts
const cron = __importStar(require("node-cron"));
const index_1 = require("../database/index");
/**
 * Serviço que finaliza automaticamente agendamentos que:
 * - Estão com status "agendado"
 * - Passaram mais de 1 dia da data do agendamento
 *
 * IMPORTANTE: Esta finalização automática NÃO envia notificação via WhatsApp
 * Apenas finalizações manuais pelo admin devem enviar WhatsApp
 */
let cronJob = null;
/**
 * Finaliza automaticamente agendamentos antigos
 * Roda todos os dias à meia-noite (00:00)
 */
function startAutoFinalizacao() {
    // Se já existe um job rodando, não cria outro
    if (cronJob) {
        console.log("⚠️ Auto-finalização já está rodando");
        return;
    }
    console.log("🔄 Iniciando serviço de auto-finalização de agendamentos...");
    // Executa todos os dias à meia-noite (00:00)
    // Formato: segundo minuto hora dia mês dia-da-semana
    cronJob = cron.schedule('0 0 * * *', async () => {
        try {
            console.log("🔍 Verificando agendamentos para finalização automática...");
            // Buscar agendamentos que:
            // 1. Estão com status "agendado"
            // 2. A data é de 1 dia atrás ou mais
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0]; // YYYY-MM-DD
            const query = `
                UPDATE agendamentos
                SET
                    status = 'finalizado',
                    updated_at = NOW()
                WHERE
                    status = 'agendado'
                    AND data < $1
                RETURNING id, usuario_id, modelo_veiculo, placa, data, horario
            `;
            const result = await index_1.pool.query(query, [oneDayAgoStr]);
            if (result.rows.length > 0) {
                console.log(`✅ ${result.rows.length} agendamento(s) finalizado(s) automaticamente:`);
                result.rows.forEach(row => {
                    console.log(`   - ID: ${row.id} | Data: ${row.data} | Horário: ${row.horario} | Veículo: ${row.modelo_veiculo} (${row.placa})`);
                });
            }
            else {
                console.log("ℹ️ Nenhum agendamento para finalizar automaticamente");
            }
        }
        catch (error) {
            console.error("❌ Erro ao finalizar agendamentos automaticamente:", error);
        }
    });
    console.log("✅ Serviço de auto-finalização iniciado com sucesso");
    console.log("📅 Próxima execução: todos os dias à meia-noite (00:00 BRT)");
    // Executar imediatamente ao iniciar (opcional, para testar)
    // executeAutoFinalizacao();
}
/**
 * Para o serviço de auto-finalização
 */
function stopAutoFinalizacao() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log("🛑 Serviço de auto-finalização parado");
    }
}
/**
 * Executa manualmente a finalização (útil para testes)
 */
async function executeAutoFinalizacao() {
    try {
        console.log("🔍 Executando finalização automática manualmente...");
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];
        const query = `
            UPDATE agendamentos
            SET
                status = 'finalizado',
                updated_at = NOW()
            WHERE
                status = 'agendado'
                AND data < $1
            RETURNING id, usuario_id, modelo_veiculo, placa, data, horario
        `;
        const result = await index_1.pool.query(query, [oneDayAgoStr]);
        if (result.rows.length > 0) {
            console.log(`✅ ${result.rows.length} agendamento(s) finalizado(s):`);
            result.rows.forEach(row => {
                console.log(`   - ID: ${row.id} | Data: ${row.data} | Horário: ${row.horario}`);
            });
            return {
                success: true,
                count: result.rows.length,
                agendamentos: result.rows
            };
        }
        else {
            console.log("ℹ️ Nenhum agendamento para finalizar");
            return {
                success: true,
                count: 0,
                agendamentos: []
            };
        }
    }
    catch (error) {
        console.error("❌ Erro ao executar finalização automática:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}
//# sourceMappingURL=autoFinalizacaoService.js.map