// src/services/reportService.ts
import { pool } from "../database/index";

export async function getMonthlyRevenue(year: number): Promise<any> {
    const query = `
        SELECT
            EXTRACT(MONTH FROM a.data) as mes,
            COUNT(*) as total_agendamentos,
            COALESCE(SUM(s.valor), 0) as receita_total
        FROM agendamentos a
        LEFT JOIN services s ON a.servico_id = s.id
        WHERE
            EXTRACT(YEAR FROM a.data) = $1
            AND a.status = 'finalizado'
        GROUP BY EXTRACT(MONTH FROM a.data)
        ORDER BY mes
    `;

    const { rows } = await pool.query(query, [year]);

    // Preencher todos os meses (1-12) mesmo que não tenham dados
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        total_agendamentos: 0,
        receita_total: 0
    }));

    rows.forEach((row: any) => {
        const monthIndex = parseInt(row.mes) - 1;
        monthlyData[monthIndex] = {
            mes: parseInt(row.mes),
            total_agendamentos: parseInt(row.total_agendamentos),
            receita_total: parseFloat(row.receita_total)
        };
    });

    return monthlyData;
}

export async function getTopServices(year?: number): Promise<any> {
    let query = `
        SELECT
            s.id,
            s.title as nome,
            COUNT(a.id) as total_agendamentos,
            COALESCE(SUM(s.valor), 0) as receita_total
        FROM services s
        LEFT JOIN agendamentos a ON s.id = a.servico_id
            AND a.status = 'finalizado'
            ${year ? 'AND EXTRACT(YEAR FROM a.data) = $1' : ''}
        WHERE s.deleted_at IS NULL
        GROUP BY s.id, s.title
        HAVING COUNT(a.id) > 0
        ORDER BY receita_total DESC
        LIMIT 10
    `;

    const params = year ? [year] : [];
    const { rows } = await pool.query(query, params);

    return rows.map((row: any) => ({
        id: row.id,
        nome: row.nome,
        total_agendamentos: parseInt(row.total_agendamentos),
        receita_total: parseFloat(row.receita_total)
    }));
}

export async function getTopClients(year?: number, limit: number = 10): Promise<any> {
    let query = `
        SELECT
            u.id,
            u.nome,
            u.email,
            COUNT(a.id) as total_agendamentos,
            COALESCE(SUM(s.valor), 0) as total_gasto,
            MAX(a.data) as ultima_visita
        FROM usuarios u
        INNER JOIN agendamentos a ON u.id = a.usuario_id
        LEFT JOIN services s ON a.servico_id = s.id
        WHERE a.status = 'finalizado'
            ${year ? 'AND EXTRACT(YEAR FROM a.data) = $1' : ''}
        GROUP BY u.id, u.nome, u.email
        ORDER BY total_agendamentos DESC, total_gasto DESC
        LIMIT $${year ? '2' : '1'}
    `;

    const params = year ? [year, limit] : [limit];
    const { rows } = await pool.query(query, params);

    return rows.map((row: any) => ({
        id: row.id,
        nome: row.nome,
        email: row.email,
        total_agendamentos: parseInt(row.total_agendamentos),
        total_gasto: parseFloat(row.total_gasto),
        ultima_visita: row.ultima_visita
    }));
}

export async function getGeneralStats(year: number): Promise<any> {
    // Total de receita do ano
    const revenueQuery = `
        SELECT COALESCE(SUM(s.valor), 0) as receita_total
        FROM agendamentos a
        LEFT JOIN services s ON a.servico_id = s.id
        WHERE EXTRACT(YEAR FROM a.data) = $1
            AND a.status = 'finalizado'
    `;
    const { rows: revenueRows } = await pool.query(revenueQuery, [year]);

    // Total de agendamentos do ano
    const appointmentsQuery = `
        SELECT
            COUNT(*) as total_agendamentos,
            COUNT(CASE WHEN status = 'finalizado' THEN 1 END) as finalizados,
            COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
            COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes
        FROM agendamentos
        WHERE EXTRACT(YEAR FROM data) = $1
    `;
    const { rows: appointmentRows } = await pool.query(appointmentsQuery, [year]);

    // Total de clientes únicos do ano
    const clientsQuery = `
        SELECT COUNT(DISTINCT usuario_id) as total_clientes
        FROM agendamentos
        WHERE EXTRACT(YEAR FROM data) = $1
    `;
    const { rows: clientRows } = await pool.query(clientsQuery, [year]);

    // Ticket médio
    const avgTicketQuery = `
        SELECT AVG(s.valor) as ticket_medio
        FROM agendamentos a
        LEFT JOIN services s ON a.servico_id = s.id
        WHERE EXTRACT(YEAR FROM a.data) = $1
            AND a.status = 'finalizado'
            AND s.valor IS NOT NULL
    `;
    const { rows: avgTicketRows } = await pool.query(avgTicketQuery, [year]);

    return {
        receita_total: parseFloat(revenueRows[0].receita_total),
        total_agendamentos: parseInt(appointmentRows[0].total_agendamentos),
        agendamentos_finalizados: parseInt(appointmentRows[0].finalizados),
        agendamentos_cancelados: parseInt(appointmentRows[0].cancelados),
        agendamentos_pendentes: parseInt(appointmentRows[0].pendentes),
        total_clientes: parseInt(clientRows[0].total_clientes),
        ticket_medio: parseFloat(avgTicketRows[0].ticket_medio || 0)
    };
}
