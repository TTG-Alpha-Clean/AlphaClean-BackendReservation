// src/services/autoFinalize.js - SISTEMA COMPLETO DE TRANSIÇÕES AUTOMÁTICAS
import { pool } from "../database/index.js";

/**
 * Atualiza automaticamente os status dos agendamentos baseado no horário
 */
export async function autoUpdateAppointmentStatus() {
    try {
        console.log('🔄 Executando atualização automática de status...');

        // 1. Agendado → Em Andamento (quando horário chega)
        const startQuery = `
            UPDATE agendamentos 
            SET status = 'em_andamento', updated_at = NOW()
            WHERE status = 'agendado' 
              AND (data + horario::time) <= NOW()
              AND (data + horario::time) >= NOW() - INTERVAL '2 hours'
            RETURNING id, data, horario, modelo_veiculo, placa, 'started' as action
        `;

        // 2. Em Andamento → Finalizado (após 60 minutos)
        const finishQuery = `
            UPDATE agendamentos 
            SET status = 'finalizado', updated_at = NOW()
            WHERE status = 'em_andamento' 
              AND (data + horario::time) < NOW() - INTERVAL '60 minutes'
            RETURNING id, data, horario, modelo_veiculo, placa, 'finished' as action
        `;

        const [startResults, finishResults] = await Promise.all([
            pool.query(startQuery),
            pool.query(finishQuery)
        ]);

        // Log resultados
        if (startResults.rows.length > 0) {
            console.log(`✅ ${startResults.rows.length} agendamento(s) iniciado(s):`);
            startResults.rows.forEach(row => {
                console.log(`   🟡 → 🟠 ID: ${row.id} | ${row.data} ${row.horario} | ${row.modelo_veiculo} (${row.placa})`);
            });
        }

        if (finishResults.rows.length > 0) {
            console.log(`✅ ${finishResults.rows.length} agendamento(s) finalizado(s):`);
            finishResults.rows.forEach(row => {
                console.log(`   🟠 → 🟢 ID: ${row.id} | ${row.data} ${row.horario} | ${row.modelo_veiculo} (${row.placa})`);
            });
        }

        if (startResults.rows.length === 0 && finishResults.rows.length === 0) {
            console.log('ℹ️  Nenhum agendamento para atualizar automaticamente');
        }

        return {
            started: startResults.rows,
            finished: finishResults.rows,
            total: startResults.rows.length + finishResults.rows.length
        };
    } catch (error) {
        console.error('❌ Erro na atualização automática de status:', error);
        throw error;
    }
}

/**
 * Middleware para executar atualização automática antes de consultas
 */
export async function autoUpdateMiddleware(req, res, next) {
    try {
        // Executa atualização automática apenas em rotas específicas
        const shouldAutoUpdate = [
            '/api/agendamentos',
            '/admin'
        ].some(path => req.path.includes(path));

        if (shouldAutoUpdate) {
            await autoUpdateAppointmentStatus();
        }

        next();
    } catch (error) {
        console.error('Erro no middleware de atualização:', error);
        // Não bloqueia a request se a atualização falhar
        next();
    }
}

/**
 * Função para executar atualização via cron job
 */
export function startAutoUpdateScheduler() {
    // Executa a cada 5 minutos para ser mais preciso
    setInterval(async () => {
        try {
            await autoUpdateAppointmentStatus();
        } catch (error) {
            console.error('Erro no scheduler de atualização:', error);
        }
    }, 5 * 60 * 1000); // 5 minutos em ms

    console.log('🕒 Scheduler de atualização automática iniciado (executa a cada 5 minutos)');
    console.log('📋 Regras de transição:');
    console.log('   🟡 Agendado → 🟠 Em Andamento: No horário marcado');
    console.log('   🟠 Em Andamento → 🟢 Finalizado: Após 60 minutos');
}

// Manter função antiga para compatibilidade
export async function autoFinalizeAppointments() {
    const result = await autoUpdateAppointmentStatus();
    return result.finished; // Retorna apenas os finalizados para compatibilidade
}

// Manter scheduler antigo para compatibilidade
export function startAutoFinalizeScheduler() {
    return startAutoUpdateScheduler();
}