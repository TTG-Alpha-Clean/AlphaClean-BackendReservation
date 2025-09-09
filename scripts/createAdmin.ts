// scripts/createAdmin.ts - CRIAR USUÁRIO ADMIN
import "dotenv/config";
import { pool } from "../src/database/index";
import { hashPassword } from "../src/utils/password";

interface AdminData {
    nome: string;
    email: string;
    senha: string;
    role: string;
}

interface UserData {
    nome: string;
    email: string;
    senha: string;
    role: string;
}

async function createAdmin(): Promise<void> {
    try {
        console.log("🚀 Criando usuário admin...");

        const adminData: AdminData = {
            nome: "Administrador",
            email: "admin@alphaclean.com",
            senha: "admin123", // ⚠️ MUDAR ESTA SENHA!
            role: "admin"
        };

        // Verificar se já existe admin
        const { rows: existingAdmin } = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [adminData.email]
        );

        if (existingAdmin.length > 0) {
            console.log("❌ Admin já existe!");
            console.log("📧 Email:", adminData.email);
            console.log("🔑 Tente a senha: admin123");
            return;
        }

        // Criptografar senha
        const hashedPassword = await hashPassword(adminData.senha);

        // Criar admin
        const { rows } = await pool.query(`
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

    } catch (error) {
        console.error("❌ Erro ao criar admin:", (error as Error).message);
    } finally {
        await pool.end();
        console.log("🔌 Conexão fechada");
        process.exit(0);
    }
}

// Função para criar usuário comum também
async function createUser(): Promise<void> {
    try {
        console.log("👤 Criando usuário comum...");

        const userData: UserData = {
            nome: "João Silva",
            email: "joao@teste.com",
            senha: "123456",
            role: "user"
        };

        // Verificar se já existe
        const { rows: existing } = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [userData.email]
        );

        if (existing.length > 0) {
            console.log("❌ Usuário já existe!");
            console.log("📧 Email:", userData.email);
            console.log("🔑 Tente a senha: 123456");
            return;
        }

        const hashedPassword = await hashPassword(userData.senha);

        const { rows } = await pool.query(`
      INSERT INTO usuarios (nome, email, senha, role, active)
      VALUES ($1, $2, $3, $4::user_role, true)
      RETURNING id, nome, email, role, created_at
    `, [userData.nome, userData.email, hashedPassword, userData.role]);

        const user = rows[0];

        console.log("✅ Usuário criado com sucesso!");
        console.log("📧 Email:", user.email);
        console.log("🔑 Senha:", userData.senha);
        console.log("👤 Role:", user.role);

    } catch (error) {
        console.error("❌ Erro ao criar usuário:", (error as Error).message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

const command = process.argv[2];

if (command === "admin") {
    createAdmin();
} else if (command === "user") {
    createUser();
} else {
    console.log("Usage:");
    console.log("ts-node scripts/createAdmin.ts admin  # Criar admin");
    console.log("ts-node scripts/createAdmin.ts user   # Criar usuário comum");
    process.exit(1);
}