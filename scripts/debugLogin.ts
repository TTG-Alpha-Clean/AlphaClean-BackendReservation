// scripts/debugLogin.ts - CORRIGIDO COM VARIÁVEIS DE AMBIENTE
import "dotenv/config";
import { pool } from "../src/database/index";
import { verifyPassword } from "../src/utils/password";

// ✅ Mostrar configuração da conexão
console.log("🔧 Configuração da conexão:");
console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "✅ Definida" : "❌ Não definida");
console.log("- DB_SSL:", process.env.DB_SSL);
console.log("- NODE_ENV:", process.env.NODE_ENV);

async function debugLogin(): Promise<void> {
    try {
        const email = "admin@alphaclean.com";
        console.log("\n🔍 Verificando usuário:", email);

        // 1. Testar conexão primeiro
        console.log("🔌 Testando conexão com banco...");
        const { rows: testRows } = await pool.query("SELECT NOW() as agora");
        console.log("✅ Conexão OK! Hora do servidor:", testRows[0].agora);

        // 2. Buscar usuário no banco
        const { rows } = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );

        if (rows.length === 0) {
            console.log("❌ Usuário não encontrado no banco!");

            // Mostrar todos os usuários para debug
            const { rows: allUsers } = await pool.query("SELECT email, nome, role FROM usuarios LIMIT 5");
            console.log("📋 Usuários existentes:", allUsers);
            return;
        }

        const user = rows[0];
        console.log("✅ Usuário encontrado:");
        console.log("- ID:", user.id);
        console.log("- Nome:", user.nome);
        console.log("- Email:", user.email);
        console.log("- Role:", user.role);
        console.log("- Active:", user.active);
        console.log("- Senha hash:", user.senha?.substring(0, 30) + "...");

        if (!user.active) {
            console.log("❌ Usuário está INATIVO!");
            return;
        }

        // 3. Testar senhas comuns
        const testPasswords = ["admin123", "123456", "admin", "password", "Alpha123"];

        console.log("\n🔐 Testando senhas...");
        for (const senha of testPasswords) {
            try {
                const isValid = await verifyPassword(senha, user.senha);
                console.log(`${isValid ? "✅" : "❌"} "${senha}": ${isValid ? "VÁLIDA" : "INVÁLIDA"}`);

                if (isValid) {
                    console.log("🎉 SENHA CORRETA ENCONTRADA!");
                    console.log(`👉 Use: ${user.email} / ${senha}`);
                    break;
                }
            } catch (error) {
                console.log("❌ Erro ao verificar senha:", (error as Error).message);
            }
        }

    } catch (error) {
        console.error("❌ Erro:", (error as Error).message);
        console.error("🔧 Verifique se as variáveis de ambiente estão corretas");
    } finally {
        await pool.end();
        process.exit(0);
    }
}

async function listUsers(): Promise<void> {
    try {
        console.log("🔌 Testando conexão...");

        // Teste de conexão
        await pool.query("SELECT 1");
        console.log("✅ Conexão OK!");

        console.log("\n👥 Listando todos os usuários:");

        const { rows } = await pool.query(`
      SELECT id, nome, email, role, active, created_at 
      FROM usuarios 
      ORDER BY created_at DESC
    `);

        if (rows.length === 0) {
            console.log("❌ Nenhum usuário encontrado!");
            return;
        }

        rows.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.nome}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👤 Role: ${user.role}`);
            console.log(`   🟢 Ativo: ${user.active}`);
            console.log(`   📅 Criado: ${new Date(user.created_at).toLocaleString()}`);
        });

    } catch (error) {
        console.error("❌ Erro:", (error as Error).message);
        if ((error as any).code === 'ECONNREFUSED') {
            console.log("🔧 Erro de conexão! Verifique:");
            console.log("- Se o DATABASE_URL está correto");
            console.log("- Se as credenciais estão válidas");
            console.log("- Se o Supabase está online");
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
}

const command = process.argv[2];

if (command === "login") {
    debugLogin();
} else if (command === "users") {
    listUsers();
} else {
    console.log("Usage:");
    console.log("ts-node scripts/debugLogin.ts login  # Debug login do admin");
    console.log("ts-node scripts/debugLogin.ts users  # Listar usuários");
    process.exit(1);
}