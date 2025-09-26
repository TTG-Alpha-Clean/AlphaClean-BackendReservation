"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByEmail = findByEmail;
exports.getById = getById;
exports.list = list;
exports.createUser = createUser;
exports.addPhone = addPhone;
exports.setActive = setActive;
exports.updateRole = updateRole;
exports.login = login;
exports.hasAnyAdmin = hasAnyAdmin;
// src/services/userService.ts
const index_1 = require("../database/index");
const apiError_1 = __importDefault(require("../utils/apiError"));
const password_1 = require("../utils/password");
async function findByEmail(email) {
    const { rows } = await index_1.pool.query(`select * from usuarios where email = $1 limit 1`, [email]);
    return rows[0] || null;
}
async function getById(id) {
    const { rows } = await index_1.pool.query(`select id, nome, email, active, role, created_at, updated_at from usuarios where id=$1`, [id]);
    return rows[0] || null;
}
async function list({ page = 1, page_size = 20, active, role }) {
    const where = [];
    const params = [];
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
    const { rows } = await index_1.pool.query(q, params);
    const { rows: [{ count }] } = await index_1.pool.query(`select count(*)::int as count from usuarios ${whereSQL}`, params);
    return { data: rows, page, page_size, total: count };
}
async function createUser({ nome, email, senha, role = "user", telefones = [] }) {
    const exists = await findByEmail(email);
    if (exists)
        throw new apiError_1.default(409, "Email já cadastrado");
    const hashed = await (0, password_1.hashPassword)(senha);
    try {
        const { rows } = await index_1.pool.query(`insert into usuarios (nome, email, senha, role)
       values ($1,$2,$3,$4::user_role)
       returning id, nome, email, active, role, created_at, updated_at`, [nome, email, hashed, role]);
        const user = rows[0];
        if (Array.isArray(telefones) && telefones.length) {
            const values = telefones.flatMap((t) => [user.id, t.ddd, t.numero, t.is_whatsapp]);
            const placeholders = telefones.map((_, idx) => `(${idx * 4 + 1}, ${idx * 4 + 2}, ${idx * 4 + 3}, ${idx * 4 + 4})`).join(",");
            await index_1.pool.query(`insert into telefones (usuario_id, ddd, numero, is_whatsapp) values ${placeholders}`, values);
        }
        return user;
    }
    catch (err) {
        if (err.code === "23505")
            throw new apiError_1.default(409, "Email já cadastrado");
        throw new apiError_1.default(500, "Erro ao criar usuário", err);
    }
}
async function addPhone({ usuario_id, ddd, numero, is_whatsapp = false }) {
    const { rows } = await index_1.pool.query(`insert into telefones (usuario_id, ddd, numero, is_whatsapp)
     values ($1,$2,$3,$4)
     returning id, ddd, numero, is_whatsapp, e164, created_at`, [usuario_id, ddd, numero, is_whatsapp]);
    return rows[0];
}
async function setActive(id, active) {
    const { rows } = await index_1.pool.query(`update usuarios set active=$1, updated_at=now() where id=$2
     returning id, nome, email, active, role, created_at, updated_at`, [!!active, id]);
    if (!rows[0])
        throw new apiError_1.default(404, "Usuário não encontrado");
    return rows[0];
}
async function updateRole(id, role) {
    const { rows } = await index_1.pool.query(`update usuarios set role=$1::user_role, updated_at=now() where id=$2
     returning id, nome, email, active, role, created_at, updated_at`, [role, id]);
    if (!rows[0])
        throw new apiError_1.default(404, "Usuário não encontrado");
    return rows[0];
}
async function login({ email, senha }) {
    const user = await findByEmail(email);
    if (!user || !user.active)
        throw new apiError_1.default(401, "Credenciais inválidas");
    const ok = await (0, password_1.verifyPassword)(senha, user.senha);
    if (!ok)
        throw new apiError_1.default(401, "Credenciais inválidas");
    // retorna dados públicos + sub para token
    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        active: user.active
    };
}
async function hasAnyAdmin() {
    const { rows } = await index_1.pool.query(`select exists (select 1 from usuarios where role = 'admin' and active = true) as has;`);
    return !!rows[0]?.has;
}
//# sourceMappingURL=userService.js.map