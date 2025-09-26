"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listServicos = listServicos;
exports.getServicoById = getServicoById;
exports.createServico = createServico;
exports.updateServico = updateServico;
exports.deleteServico = deleteServico;
// src/services/servicoService.ts
const index_1 = require("../database/index");
const apiError_1 = __importDefault(require("../utils/apiError"));
async function listServicos({ ativo = true } = {}) {
    const query = ativo
        ? "SELECT * FROM servicos WHERE ativo = true ORDER BY nome ASC"
        : "SELECT * FROM servicos ORDER BY nome ASC";
    const { rows } = await index_1.pool.query(query);
    return rows;
}
async function getServicoById(id) {
    const { rows } = await index_1.pool.query("SELECT * FROM servicos WHERE id = $1", [id]);
    return rows[0] || null;
}
async function createServico({ nome, valor }) {
    if (!nome || !valor) {
        throw new apiError_1.default(400, "Nome e valor são obrigatórios");
    }
    if (valor <= 0) {
        throw new apiError_1.default(400, "Valor deve ser maior que zero");
    }
    try {
        const { rows } = await index_1.pool.query(`INSERT INTO servicos (nome, valor) 
       VALUES ($1, $2) 
       RETURNING *`, [nome.trim(), Number(valor)]);
        return rows[0];
    }
    catch (err) {
        if (err.code === "23505") { // unique constraint
            throw new apiError_1.default(409, "Já existe um serviço com este nome");
        }
        throw new apiError_1.default(500, "Erro ao criar serviço", err);
    }
}
async function updateServico(id, { nome, valor, ativo }) {
    const servico = await getServicoById(id);
    if (!servico) {
        throw new apiError_1.default(404, "Serviço não encontrado");
    }
    if (valor !== undefined && valor <= 0) {
        throw new apiError_1.default(400, "Valor deve ser maior que zero");
    }
    const updates = [];
    const params = [];
    let paramIndex = 1;
    if (nome !== undefined) {
        updates.push(`nome = ${paramIndex++}`);
        params.push(nome.trim());
    }
    if (valor !== undefined) {
        updates.push(`valor = ${paramIndex++}`);
        params.push(Number(valor));
    }
    if (ativo !== undefined) {
        updates.push(`ativo = ${paramIndex++}`);
        params.push(Boolean(ativo));
    }
    if (updates.length === 0) {
        return servico; // Nada para atualizar
    }
    updates.push(`updated_at = NOW()`);
    params.push(id);
    try {
        const { rows } = await index_1.pool.query(`UPDATE servicos SET ${updates.join(', ')} WHERE id = ${paramIndex} RETURNING *`, params);
        return rows[0];
    }
    catch (err) {
        if (err.code === "23505") {
            throw new apiError_1.default(409, "Já existe um serviço com este nome");
        }
        throw new apiError_1.default(500, "Erro ao atualizar serviço", err);
    }
}
async function deleteServico(id) {
    const servico = await getServicoById(id);
    if (!servico) {
        throw new apiError_1.default(404, "Serviço não encontrado");
    }
    // Verificar se há agendamentos usando este serviço
    const { rowCount } = await index_1.pool.query("SELECT 1 FROM agendamentos WHERE servico_id = $1 LIMIT 1", [id]);
    if (rowCount && rowCount > 0) {
        // Em vez de deletar, desativa o serviço
        return await updateServico(id, { ativo: false });
    }
    // Se não há agendamentos, pode deletar
    await index_1.pool.query("DELETE FROM servicos WHERE id = $1", [id]);
    return { deleted: true };
}
//# sourceMappingURL=servicoService.js.map