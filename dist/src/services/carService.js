"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUserCars = listUserCars;
exports.getCarById = getCarById;
exports.createCar = createCar;
exports.updateCar = updateCar;
exports.deleteCar = deleteCar;
exports.setDefaultCar = setDefaultCar;
exports.getDefaultCar = getDefaultCar;
// src/services/carService.ts
const index_1 = require("../database/index");
const apiError_1 = __importDefault(require("../utils/apiError"));
const agendamentoService_1 = require("./agendamentoService");
async function listUserCars(usuario_id, filters = {}) {
    const { page = 1, page_size = 20, marca } = filters;
    const where = ['usuario_id = $1'];
    const params = [usuario_id];
    let i = 2;
    if (marca) {
        where.push(`LOWER(marca) LIKE LOWER($${i++})`);
        params.push(`%${marca}%`);
    }
    const whereSQL = where.join(' AND ');
    const offset = (page - 1) * page_size;
    const query = `
        SELECT *
        FROM cars
        WHERE ${whereSQL}
        ORDER BY is_default DESC, created_at DESC
        LIMIT $${i++} OFFSET $${i++}
    `;
    params.push(page_size, offset);
    const countQuery = `
        SELECT COUNT(*)::int AS total
        FROM cars
        WHERE ${whereSQL}
    `;
    const countParams = params.slice(0, -2);
    const [dataResult, countResult] = await Promise.all([
        index_1.pool.query(query, params),
        index_1.pool.query(countQuery, countParams)
    ]);
    const totalItems = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / page_size);
    return {
        data: dataResult.rows,
        pagination: {
            page,
            page_size,
            total_items: totalItems,
            total_pages: totalPages,
            has_next: page < totalPages,
            has_prev: page > 1
        }
    };
}
async function getCarById(id, usuario_id) {
    const { rows } = await index_1.pool.query('SELECT * FROM cars WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
    return rows[0] || null;
}
async function createCar(usuario_id, payload) {
    const { modelo_veiculo, cor, placa, ano, marca, observacoes, is_default = false } = payload;
    if (!modelo_veiculo || !placa) {
        throw new apiError_1.default(400, "Modelo do veículo e placa são obrigatórios");
    }
    const sanitizedPlate = (0, agendamentoService_1.sanitizePlate)(placa);
    if (!sanitizedPlate) {
        throw new apiError_1.default(400, "Placa inválida");
    }
    // Verificar se a placa já existe para este usuário
    const existingCar = await index_1.pool.query('SELECT id FROM cars WHERE placa = $1 AND usuario_id = $2', [sanitizedPlate, usuario_id]);
    if (existingCar.rows.length > 0) {
        throw new apiError_1.default(409, "Você já possui um carro cadastrado com esta placa");
    }
    const query = `
        INSERT INTO cars (
            usuario_id, modelo_veiculo, cor, placa, ano, marca,
            observacoes, is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const { rows } = await index_1.pool.query(query, [
        usuario_id, modelo_veiculo, cor, sanitizedPlate,
        ano, marca, observacoes, is_default
    ]);
    return rows[0];
}
async function updateCar(id, usuario_id, payload) {
    // Verificar se o carro existe e pertence ao usuário
    const existingCar = await getCarById(id, usuario_id);
    if (!existingCar) {
        throw new apiError_1.default(404, "Carro não encontrado");
    }
    const { modelo_veiculo, cor, placa, ano, marca, observacoes, is_default } = payload;
    // Se a placa foi alterada, verificar se não existe outro carro com a mesma placa
    if (placa && placa !== existingCar.placa) {
        const sanitizedPlate = (0, agendamentoService_1.sanitizePlate)(placa);
        if (!sanitizedPlate) {
            throw new apiError_1.default(400, "Placa inválida");
        }
        const existingPlate = await index_1.pool.query('SELECT id FROM cars WHERE placa = $1 AND usuario_id = $2 AND id != $3', [sanitizedPlate, usuario_id, id]);
        if (existingPlate.rows.length > 0) {
            throw new apiError_1.default(409, "Você já possui outro carro cadastrado com esta placa");
        }
    }
    // Construir query dinâmica
    const updates = [];
    const params = [];
    let i = 1;
    if (modelo_veiculo !== undefined) {
        updates.push(`modelo_veiculo = $${i++}`);
        params.push(modelo_veiculo);
    }
    if (cor !== undefined) {
        updates.push(`cor = $${i++}`);
        params.push(cor);
    }
    if (placa !== undefined) {
        updates.push(`placa = $${i++}`);
        params.push((0, agendamentoService_1.sanitizePlate)(placa));
    }
    if (ano !== undefined) {
        updates.push(`ano = $${i++}`);
        params.push(ano);
    }
    if (marca !== undefined) {
        updates.push(`marca = $${i++}`);
        params.push(marca);
    }
    if (observacoes !== undefined) {
        updates.push(`observacoes = $${i++}`);
        params.push(observacoes);
    }
    if (is_default !== undefined) {
        updates.push(`is_default = $${i++}`);
        params.push(is_default);
    }
    if (updates.length === 0) {
        throw new apiError_1.default(400, "Nenhum campo para atualizar");
    }
    updates.push(`updated_at = NOW()`);
    params.push(id, usuario_id);
    const query = `
        UPDATE cars
        SET ${updates.join(', ')}
        WHERE id = $${i++} AND usuario_id = $${i++}
        RETURNING *
    `;
    const { rows } = await index_1.pool.query(query, params);
    if (!rows[0]) {
        throw new apiError_1.default(404, "Carro não encontrado");
    }
    return rows[0];
}
async function deleteCar(id, usuario_id) {
    // Verificar se o carro existe e pertence ao usuário
    const car = await getCarById(id, usuario_id);
    if (!car) {
        throw new apiError_1.default(404, "Carro não encontrado");
    }
    // Verificar se há agendamentos ativos com este carro
    const activeSchedules = await index_1.pool.query(`
        SELECT COUNT(*)::int as count
        FROM agendamentos
        WHERE usuario_id = $1
          AND placa = $2
          AND status IN ('agendado')
    `, [usuario_id, car.placa]);
    if (activeSchedules.rows[0]?.count > 0) {
        throw new apiError_1.default(400, "Não é possível excluir um carro que possui agendamentos ativos");
    }
    // Hard delete - remover permanentemente
    await index_1.pool.query('DELETE FROM cars WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
}
async function setDefaultCar(id, usuario_id) {
    // Verificar se o carro existe e pertence ao usuário
    const car = await getCarById(id, usuario_id);
    if (!car) {
        throw new apiError_1.default(404, "Carro não encontrado");
    }
    // O trigger já vai garantir que apenas este seja o padrão
    const { rows } = await index_1.pool.query('UPDATE cars SET is_default = true, updated_at = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *', [id, usuario_id]);
    return rows[0];
}
async function getDefaultCar(usuario_id) {
    const { rows } = await index_1.pool.query('SELECT * FROM cars WHERE usuario_id = $1 AND is_default = true LIMIT 1', [usuario_id]);
    return rows[0] || null;
}
//# sourceMappingURL=carService.js.map