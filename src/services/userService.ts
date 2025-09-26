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
    const { rows } = await pool.query(`select id, nome, email, active, role, created_at, updated_at from usuarios where id=$1`, [id]);
    return rows[0] || null;
}

export async function list({ page = 1, page_size = 20, active, role }: any): Promise<any> {
    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (active !== undefined) {
        where.push(`active = ${i++}`);
        params.push(!!active);
    }
    if (role) {
        where.push(`role = ${i++}::user_role`);
        params.push(role);
    }

    const whereSQL = where.length ? `where ${where.join(" and ")}` : "";
    const offset = (page - 1) * page_size;

    const q = `
    select id, nome, email, active, role, created_at, updated_at
    from usuarios
    ${whereSQL}
    order by created_at desc
    limit ${page_size} offset ${offset}`;

    const { rows } = await pool.query(q, params);
    const { rows: [{ count }] } = await pool.query(`select count(*)::int as count from usuarios ${whereSQL}`, params);

    return { data: rows, page, page_size, total: count };
}

export async function createUser({ nome, email, senha, role = "user", telefones = [] }: any): Promise<any> {
    const exists = await findByEmail(email);
    if (exists) throw new ApiError(409, "Email já cadastrado");

    const hashed = await hashPassword(senha);

    try {
        const { rows } = await pool.query(
            `insert into usuarios (nome, email, senha, role)
       values ($1,$2,$3,$4::user_role)
       returning id, nome, email, active, role, created_at, updated_at`,
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
        if (err.code === "23505") throw new ApiError(409, "Email já cadastrado");
        throw new ApiError(500, "Erro ao criar usuário", err);
    }
}

export async function addPhone({ usuario_id, ddd, numero, is_whatsapp = false }: any): Promise<any> {
    const { rows } = await pool.query(
        `insert into telefones (usuario_id, ddd, numero, is_whatsapp)
     values ($1,$2,$3,$4)
     returning id, ddd, numero, is_whatsapp, e164, created_at`,
        [usuario_id, ddd, numero, is_whatsapp]
    );
    return rows[0];
}

export async function setActive(id: string, active: boolean): Promise<any> {
    const { rows } = await pool.query(
        `update usuarios set active=$1, updated_at=now() where id=$2
     returning id, nome, email, active, role, created_at, updated_at`,
        [!!active, id]
    );
    if (!rows[0]) throw new ApiError(404, "Usuário não encontrado");
    return rows[0];
}

export async function updateRole(id: string, role: string): Promise<any> {
    const { rows } = await pool.query(
        `update usuarios set role=$1::user_role, updated_at=now() where id=$2
     returning id, nome, email, active, role, created_at, updated_at`,
        [role, id]
    );
    if (!rows[0]) throw new ApiError(404, "Usuário não encontrado");
    return rows[0];
}

export async function login({ email, senha }: any): Promise<any> {
    const user = await findByEmail(email);
    if (!user || !user.active) throw new ApiError(401, "Credenciais inválidas");

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
        role: user.role,
        active: user.active
    };
}

export async function hasAnyAdmin(): Promise<boolean> {
    const { rows } = await pool.query(
        `select exists (select 1 from usuarios where role = 'admin' and active = true) as has;`
    );
    return !!rows[0]?.has;
}