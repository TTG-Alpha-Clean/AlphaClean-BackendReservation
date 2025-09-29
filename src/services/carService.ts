// src/services/carService.ts
import { pool } from "../database/index";
import ApiError from "../utils/apiError";
import { sanitizePlate } from "./agendamentoService";

export interface Car {
    id: string;
    usuario_id: string;
    modelo_veiculo: string;
    cor?: string | null;
    placa: string;
    ano?: string | null;
    marca?: string | null;
    observacoes?: string | null;
    is_default: boolean;
    ativo: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCarPayload {
    modelo_veiculo: string;
    cor?: string | null;
    placa: string;
    ano?: string | null;
    marca?: string | null;
    observacoes?: string | null;
    is_default?: boolean;
}

export interface UpdateCarPayload {
    modelo_veiculo?: string;
    cor?: string | null;
    placa?: string;
    ano?: string | null;
    marca?: string | null;
    observacoes?: string | null;
    is_default?: boolean;
    ativo?: boolean;
}

export interface ListCarsFilters {
    page?: number;
    page_size?: number;
    ativo?: boolean;
    marca?: string;
}

export async function listUserCars(usuario_id: string, filters: ListCarsFilters = {}) {
    const {
        page = 1,
        page_size = 20,
        ativo = true,
        marca
    } = filters;

    const where: string[] = ['usuario_id = $1'];
    const params: any[] = [usuario_id];
    let i = 2;

    if (ativo !== undefined) {
        where.push(`ativo = $${i++}`);
        params.push(ativo);
    }

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
        pool.query(query, params),
        pool.query(countQuery, countParams)
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

export async function getCarById(id: string, usuario_id: string): Promise<Car | null> {
    const { rows } = await pool.query(
        'SELECT * FROM cars WHERE id = $1 AND usuario_id = $2',
        [id, usuario_id]
    );
    return rows[0] || null;
}

export async function createCar(usuario_id: string, payload: CreateCarPayload): Promise<Car> {
    const {
        modelo_veiculo,
        cor,
        placa,
        ano,
        marca,
        observacoes,
        is_default = false
    } = payload;

    if (!modelo_veiculo || !placa) {
        throw new ApiError(400, "Modelo do veículo e placa são obrigatórios");
    }

    const sanitizedPlate = sanitizePlate(placa);
    if (!sanitizedPlate) {
        throw new ApiError(400, "Placa inválida");
    }

    // Verificar se a placa já existe para este usuário
    const existingCar = await pool.query(
        'SELECT id FROM cars WHERE placa = $1 AND usuario_id = $2 AND ativo = true',
        [sanitizedPlate, usuario_id]
    );

    if (existingCar.rows.length > 0) {
        throw new ApiError(409, "Você já possui um carro cadastrado com esta placa");
    }

    const query = `
        INSERT INTO cars (
            usuario_id, modelo_veiculo, cor, placa, ano, marca,
            observacoes, is_default, ativo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING *
    `;

    const { rows } = await pool.query(query, [
        usuario_id, modelo_veiculo, cor, sanitizedPlate,
        ano, marca, observacoes, is_default
    ]);

    return rows[0];
}

export async function updateCar(id: string, usuario_id: string, payload: UpdateCarPayload): Promise<Car> {
    // Verificar se o carro existe e pertence ao usuário
    const existingCar = await getCarById(id, usuario_id);
    if (!existingCar) {
        throw new ApiError(404, "Carro não encontrado");
    }

    const {
        modelo_veiculo,
        cor,
        placa,
        ano,
        marca,
        observacoes,
        is_default,
        ativo
    } = payload;

    // Se a placa foi alterada, verificar se não existe outro carro com a mesma placa
    if (placa && placa !== existingCar.placa) {
        const sanitizedPlate = sanitizePlate(placa);
        if (!sanitizedPlate) {
            throw new ApiError(400, "Placa inválida");
        }

        const existingPlate = await pool.query(
            'SELECT id FROM cars WHERE placa = $1 AND usuario_id = $2 AND id != $3 AND ativo = true',
            [sanitizedPlate, usuario_id, id]
        );

        if (existingPlate.rows.length > 0) {
            throw new ApiError(409, "Você já possui outro carro cadastrado com esta placa");
        }
    }

    // Construir query dinâmica
    const updates: string[] = [];
    const params: any[] = [];
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
        params.push(sanitizePlate(placa));
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
    if (ativo !== undefined) {
        updates.push(`ativo = $${i++}`);
        params.push(ativo);
    }

    if (updates.length === 0) {
        throw new ApiError(400, "Nenhum campo para atualizar");
    }

    updates.push(`updated_at = NOW()`);
    params.push(id, usuario_id);

    const query = `
        UPDATE cars
        SET ${updates.join(', ')}
        WHERE id = $${i++} AND usuario_id = $${i++}
        RETURNING *
    `;

    const { rows } = await pool.query(query, params);

    if (!rows[0]) {
        throw new ApiError(404, "Carro não encontrado");
    }

    return rows[0];
}

export async function deleteCar(id: string, usuario_id: string): Promise<void> {
    // Verificar se o carro existe e pertence ao usuário
    const car = await getCarById(id, usuario_id);
    if (!car) {
        throw new ApiError(404, "Carro não encontrado");
    }

    // Verificar se há agendamentos ativos com este carro
    const activeSchedules = await pool.query(`
        SELECT COUNT(*)::int as count
        FROM agendamentos
        WHERE usuario_id = $1
          AND placa = $2
          AND status IN ('agendado')
    `, [usuario_id, car.placa]);

    if (activeSchedules.rows[0]?.count > 0) {
        throw new ApiError(400, "Não é possível excluir um carro que possui agendamentos ativos");
    }

    // Soft delete - marcar como inativo
    await pool.query(
        'UPDATE cars SET ativo = false, updated_at = NOW() WHERE id = $1 AND usuario_id = $2',
        [id, usuario_id]
    );
}

export async function setDefaultCar(id: string, usuario_id: string): Promise<Car> {
    // Verificar se o carro existe e pertence ao usuário
    const car = await getCarById(id, usuario_id);
    if (!car) {
        throw new ApiError(404, "Carro não encontrado");
    }

    if (!car.ativo) {
        throw new ApiError(400, "Não é possível definir um carro inativo como padrão");
    }

    // O trigger já vai garantir que apenas este seja o padrão
    const { rows } = await pool.query(
        'UPDATE cars SET is_default = true, updated_at = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *',
        [id, usuario_id]
    );

    return rows[0];
}

export async function getDefaultCar(usuario_id: string): Promise<Car | null> {
    const { rows } = await pool.query(
        'SELECT * FROM cars WHERE usuario_id = $1 AND is_default = true AND ativo = true LIMIT 1',
        [usuario_id]
    );
    return rows[0] || null;
}