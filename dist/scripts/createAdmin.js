"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/createAdmin.ts - CRIAR USUÁRIO ADMIN
require("dotenv/config");
const index_1 = require("../src/database/index");
const password_1 = require("../src/utils/password");
async function createAdmin() {
    try {
        console.log("🚀 Criando usuário admin...");
        const adminData = {
            nome: "Administrador",
            email: "admin@alphaclean.com",
            senha: "admin123", // ⚠️ MUDAR ESTA SENHA!
            role: "admin"
        };
        // Verificar se já existe admin
        const { rows: existingAdmin } = await index_1.pool.query("SELECT * FROM usuarios WHERE email = $1", [adminData.email]);
        if (existingAdmin.length > 0) {
            console.log("❌ Admin já existe!");
            console.log("📧 Email:", adminData.email);
            console.log("🔑 Tente a senha: admin123");
            return;
        }
        // Criptografar senha
        const hashedPassword = await (0, password_1.hashPassword)(adminData.senha);
        // Criar admin
        const { rows } = await index_1.pool.query(`
      INSERT INTO usuarios (nome, email, senha, role, active)
      VALUES ($1, $2, $3, $4::user_role, true)
      RETURNING id, nome, email, role, created_at
    `, [adminData.nome, adminData.email, hashedPassword, adminData.role]);
        const admin = rows[0];
        console.log("✅ Admin criado com sucesso!");
        console.log("📧 Email:", admin.email);
        console.log("🔑 Senha:", adminData.senha);
        console.log("👤 Role:", admin.role);
        console.log("🆔 ID:", admin.id);
        console.log("📅 Criado em:", admin.created_at);
    }
    catch (error) {
        console.error("❌ Erro ao criar admin:", error.message);
    }
    finally {
        await index_1.pool.end();
        console.log("🔌 Conexão fechada");
        process.exit(0);
    }
}
// Função para criar usuário comum também
async function createUser() {
    try {
        console.log("👤 Criando usuário comum...");
        const userData = {
            nome: "João Silva",
            email: "joao@teste.com",
            senha: "123456",
            role: "user"
        };
        // Verificar se já existe
        const { rows: existing } = await index_1.pool.query("SELECT * FROM usuarios WHERE email = $1", [userData.email]);
        if (existing.length > 0) {
            console.log("❌ Usuário já existe!");
            console.log("📧 Email:", userData.email);
            console.log("🔑 Tente a senha: 123456");
            return;
        }
        const hashedPassword = await (0, password_1.hashPassword)(userData.senha);
        const { rows } = await index_1.pool.query(`
      INSERT INTO usuarios (nome, email, senha, role, active)
      VALUES ($1, $2, $3, $4::user_role, true)
      RETURNING id, nome, email, role, created_at
    `, [userData.nome, userData.email, hashedPassword, userData.role]);
        const user = rows[0];
        console.log("✅ Usuário criado com sucesso!");
        console.log("📧 Email:", user.email);
        console.log("🔑 Senha:", userData.senha);
        console.log("👤 Role:", user.role);
    }
    catch (error) {
        console.error("❌ Erro ao criar usuário:", error.message);
    }
    finally {
        await index_1.pool.end();
        process.exit(0);
    }
}
const command = process.argv[2];
if (command === "admin") {
    createAdmin();
}
else if (command === "user") {
    createUser();
}
else {
    console.log("Usage:");
    console.log("ts-node scripts/createAdmin.ts admin  # Criar admin");
    console.log("ts-node scripts/createAdmin.ts user   # Criar usuário comum");
    process.exit(1);
}
//# sourceMappingURL=createAdmin.js.map