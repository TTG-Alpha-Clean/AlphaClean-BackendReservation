// src/services/userService.ts
import { pool } from "../database/index";
import ApiError from "../utils/apiError";
import { hashPassword, verifyPassword } from "../utils/password";
import bcrypt from 'bcryptjs';

export async function findByEmail(email: string): Promise<any> {
    const { rows } = await pool.query(`select * from usuarios where email = $1 limit 1`, [email]);
    return rows[0] || null;
}

export async function getById(id: string): Promise<any> {
    const { rows } = await pool.query(`select id, nome, email, role, created_at, updated_at from usuarios where id=$1`, [id]);
    return rows[0] || null;
}

export async function getUserPhone(userId: string): Promise<string | null> {
    const { rows } = await pool.query(
        'select ddd, numero from telefones where usuario_id = $1 limit 1',
        [userId]
    );

    if (rows.length === 0) return null;

    // Retorna o telefone formatado (com DDD se existir)
    const { ddd, numero } = rows[0];
    if (ddd) {
        return `(${ddd}) ${numero}`;
    }
    return numero;
}

export async function list({ page = 1, page_size = 20, role }: any): Promise<any> {
    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (role) {
        where.push(`role = $${i++}`);
        params.push(role);
    }

    const whereSQL = where.length ? `where ${where.join(" and ")}` : "";
    const offset = (page - 1) * page_size;

    // Query simplificada - buscar apenas usuários primeiro
    const q = `
    select id, nome, email, role, created_at, updated_at
    from usuarios
    ${whereSQL}
    order by created_at desc
    limit ${page_size} offset ${offset}`;

    const { rows } = await pool.query(q, params);
    const { rows: [{ count }] } = await pool.query(`select count(*)::int as count from usuarios ${whereSQL}`, params);

    // Buscar telefones e carros separadamente para cada usuário
    const formattedData = await Promise.all(rows.map(async (user: any) => {
        // Buscar telefones (ddd + numero)
        const { rows: phones } = await pool.query(
            'select ddd, numero from telefones where usuario_id = $1 limit 1',
            [user.id]
        );

        // Buscar carros
        const { rows: cars } = await pool.query(
            'select id, marca, modelo_veiculo as modelo, ano, placa from cars where usuario_id = $1',
            [user.id]
        );

        return {
            _id: user.id,
            name: user.nome,
            email: user.email,
            phone: phones.length > 0 ? `+55${phones[0].ddd}${phones[0].numero}` : '',
            role: user.role,
            createdAt: user.created_at,
            cars: cars.map((car: any) => ({
                _id: car.id,
                brand: car.marca || '',
                model: car.modelo,
                year: car.ano || '',
                licensePlate: car.placa
            }))
        };
    }));

    return { data: formattedData, page, page_size, total: count };
}

export async function createUser({ nome, email, senha, role = "user", telefones = [] }: any): Promise<any> {
    const exists = await findByEmail(email);
    if (exists) throw new ApiError(409, "Email já cadastrado");

    const hashed = await hashPassword(senha);

    try {
        const { rows } = await pool.query(
            `insert into usuarios (nome, email, senha, role)
       values ($1,$2,$3,$4)
       returning id, nome, email, role, created_at, updated_at`,
            [nome, email, hashed, role]
        );

        const user = rows[0];

        if (Array.isArray(telefones) && telefones.length) {
            const values = telefones.flatMap((t: any) => [user.id, t.ddd, t.numero, t.is_whatsapp]);
            const placeholders = telefones.map((_: any, idx: number) =>
                `($${idx * 4 + 1}, $${idx * 4 + 2}, $${idx * 4 + 3}, $${idx * 4 + 4})`).join(",");

            await pool.query(
                `insert into telefones (usuario_id, ddd, numero, is_whatsapp) values ${placeholders}`,
                values
            );
        }

        return user;
    } catch (err: any) {
        console.error("❌ Erro ao criar usuário:", err);
        if (err.code === "23505") throw new ApiError(409, "Email já cadastrado");
        throw new ApiError(500, "Erro ao criar usuário", err);
    }
}

export async function addPhone({ usuario_id, ddd, numero, is_whatsapp = false }: any): Promise<any> {
    const { rows } = await pool.query(
        `insert into telefones (usuario_id, ddd, numero, is_whatsapp)
     values ($1,$2,$3,$4)
     returning id, ddd, numero, is_whatsapp, created_at`,
        [usuario_id, ddd, numero, is_whatsapp]
    );
    return rows[0];
}

export async function setActive(id: string, active: boolean): Promise<any> {
    // Nota: Coluna 'active' removida do schema - esta função está deprecated
    // Mantida por compatibilidade mas não faz nada
    const user = await getById(id);
    if (!user) throw new ApiError(404, "Usuário não encontrado");
    return user;
}

export async function updateRole(id: string, role: string): Promise<any> {
    const { rows } = await pool.query(
        `update usuarios set role=$1, updated_at=now() where id=$2
     returning id, nome, email, role, created_at, updated_at`,
        [role, id]
    );
    if (!rows[0]) throw new ApiError(404, "Usuário não encontrado");
    return rows[0];
}

export async function login({ email, senha }: any): Promise<any> {
    const user = await findByEmail(email);
    if (!user) throw new ApiError(401, "Credenciais inválidas");

    // Suporte para ambos os formatos de hash: scrypt e bcrypt
    let ok = false;
    if (user.senha.startsWith('$2b$')) {
        // Hash bcrypt (usado pelo admin)
        ok = await bcrypt.compare(senha, user.senha);
    } else if (user.senha.startsWith('scrypt$')) {
        // Hash scrypt (usado por usuarios normais)
        ok = await verifyPassword(senha, user.senha);
    }

    if (!ok) throw new ApiError(401, "Credenciais inválidas");

    // retorna dados públicos + sub para token
    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role
    };
}

export async function hasAnyAdmin(): Promise<boolean> {
    const { rows } = await pool.query(
        `select exists (select 1 from usuarios where role = 'admin') as has;`
    );
    return !!rows[0]?.has;
}

export async function updateProfile(userId: string, data: { telefone: string }): Promise<any> {
    const user = await getById(userId);
    if (!user) throw new ApiError(404, "Usuário não encontrado");

    // Atualizar/criar telefone
    const { rows: existingPhone } = await pool.query(
        'select id from telefones where usuario_id = $1 limit 1',
        [userId]
    );

    if (existingPhone.length > 0) {
        // Atualizar telefone existente
        await pool.query(
            'update telefones set numero = $1, updated_at = now() where usuario_id = $2',
            [data.telefone, userId]
        );
    } else {
        // Criar novo telefone
        await pool.query(
            'insert into telefones (usuario_id, ddd, numero, is_whatsapp) values ($1, $2, $3, $4)',
            [userId, '', data.telefone, true]
        );
    }

    // Retornar usuário atualizado com telefone
    const { rows: phones } = await pool.query(
        'select ddd, numero from telefones where usuario_id = $1 limit 1',
        [userId]
    );

    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: phones.length > 0 ? phones[0].numero : '',
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
    };
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const { rows } = await pool.query('select senha from usuarios where id = $1', [userId]);

    if (!rows[0]) throw new ApiError(404, "Usuário não encontrado");

    const user = rows[0];

    // Verificar senha atual
    let ok = false;
    if (user.senha.startsWith('$2b$')) {
        // Hash bcrypt
        ok = await bcrypt.compare(currentPassword, user.senha);
    } else if (user.senha.startsWith('scrypt$')) {
        // Hash scrypt
        ok = await verifyPassword(currentPassword, user.senha);
    }

    if (!ok) throw new ApiError(401, "Senha atual incorreta");

    // Atualizar para nova senha usando bcrypt
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
        'update usuarios set senha = $1, updated_at = now() where id = $2',
        [hashedNewPassword, userId]
    );
}