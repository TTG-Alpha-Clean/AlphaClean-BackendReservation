// src/services/autoFinalizacaoService.ts
import * as cron from 'node-cron';
import { pool } from '../database/index';

/**
 * Serviço que finaliza automaticamente agendamentos que:
 * - Estão com status "agendado"
 * - Passaram mais de 5 horas da data/hora do agendamento
 *
 * IMPORTANTE: Esta finalização automática NÃO envia notificação via WhatsApp
 * Apenas finalizações manuais pelo admin devem enviar WhatsApp
 */

let cronJob: cron.ScheduledTask | null = null;

/**
 * Finaliza automaticamente agendamentos antigos
 * Roda a cada hora para verificar agendamentos que passaram mais de 5 horas
 */
export function startAutoFinalizacao() {
    // Se já existe um job rodando, não cria outro
    if (cronJob) {
        console.log("⚠️ Auto-finalização já está rodando");
        return;
    }

    console.log("🔄 Iniciando serviço de auto-finalização de agendamentos...");

    // Executa a cada hora (no minuto 0)
    // Formato: segundo minuto hora dia mês dia-da-semana
    cronJob = cron.schedule('0 * * * *', async () => {
        try {
            console.log("🔍 Verificando agendamentos para finalização automática...");

            // Buscar agendamentos que:
            // 1. Estão com status "agendado"
            // 2. Passaram mais de 5 horas desde a data/hora do agendamento
            const fiveHoursAgo = new Date();
            fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);

            const query = `
                UPDATE agendamentos
                SET
                    status = 'finalizado',
                    updated_at = NOW()
                WHERE
                    status = 'agendado'
                    AND (
                        -- Concatena data e horário para comparar com timestamp
                        (data::text || ' ' || horario::text)::timestamp < $1
                    )
                RETURNING id, usuario_id, modelo_veiculo, placa, data, horario
            `;

            const result = await pool.query(query, [fiveHoursAgo]);

            if (result.rows.length > 0) {
                console.log(`✅ ${result.rows.length} agendamento(s) finalizado(s) automaticamente:`);
                result.rows.forEach(row => {
                    console.log(`   - ID: ${row.id} | Data: ${row.data} | Horário: ${row.horario} | Veículo: ${row.modelo_veiculo} (${row.placa})`);
                });
            } else {
                console.log("ℹ️ Nenhum agendamento para finalizar automaticamente");
            }

        } catch (error) {
            console.error("❌ Erro ao finalizar agendamentos automaticamente:", error);
        }
    });

    console.log("✅ Serviço de auto-finalização iniciado com sucesso");
    console.log("📅 Execução: a cada hora, finalizando agendamentos com mais de 5 horas");

    // Executar imediatamente ao iniciar (opcional, para testar)
    // executeAutoFinalizacao();
}

/**
 * Para o serviço de auto-finalização
 */
export function stopAutoFinalizacao() {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log("🛑 Serviço de auto-finalização parado");
    }
}

/**
 * Executa manualmente a finalização (útil para testes)
 */
export async function executeAutoFinalizacao() {
    try {
        console.log("🔍 Executando finalização automática manualmente...");

        const fiveHoursAgo = new Date();
        fiveHoursAgo.setHours(fiveHoursAgo.getHours() - 5);

        const query = `
            UPDATE agendamentos
            SET
                status = 'finalizado',
                updated_at = NOW()
            WHERE
                status = 'agendado'
                AND (
                    -- Concatena data e horário para comparar com timestamp
                    (data::text || ' ' || horario::text)::timestamp < $1
                )
            RETURNING id, usuario_id, modelo_veiculo, placa, data, horario
        `;

        const result = await pool.query(query, [fiveHoursAgo]);

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
        } else {
            console.log("ℹ️ Nenhum agendamento para finalizar");
            return {
                success: true,
                count: 0,
                agendamentos: []
            };
        }

    } catch (error) {
        console.error("❌ Erro ao executar finalização automática:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}
