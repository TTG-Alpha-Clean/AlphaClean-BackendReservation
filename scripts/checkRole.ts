// scripts/checkRole.ts - VERIFICAR E CORRIGIR ROLE
import "dotenv/config";
import { pool } from "../src/database/index";

async function checkUserRole(): Promise<void> {
    try {
        const email = "admin@alphaclean.com";
        console.log("🔍 Verificando role do usuário:", email);

        // Buscar usuário
        const { rows } = await pool.query(
            "SELECT id, nome, email, role, active FROM usuarios WHERE email = $1",
            [email]
        );

        if (rows.length === 0) {
            console.log("❌ Usuário não encontrado!");
            return;
        }

        const user = rows[0];
        console.log("👤 Dados do usuário:");
        console.log("- ID:", user.id);
        console.log("- Nome:", user.nome);
        console.log("- Email:", user.email);
        console.log("- Role:", user.role);
        console.log("- Ativo:", user.active);

        // Verificar se é admin
        if (user.role === "admin") {
            console.log("✅ Usuário JÁ É ADMIN!");
        } else {
            console.log("❌ Usuário NÃO É ADMIN!");
            console.log("🔧 Role atual:", user.role);
        }

    } catch (error) {
        console.error("❌ Erro:", (error as Error).message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

async function makeUserAdmin(): Promise<void> {
    try {
        const email = "admin@alphaclean.com";
        console.log("🛠️ Transformando usuário em admin:", email);

        // Atualizar role para admin
        const { rows } = await pool.query(`
      UPDATE usuarios 
      SET role = 'admin'::user_role, updated_at = NOW() 
      WHERE email = $1 
      RETURNING id, nome, email, role, active
    `, [email]);

        if (rows.length === 0) {
            console.log("❌ Usuário não encontrado!");
            return;
        }

        const user = rows[0];
        console.log("✅ Usuário atualizado para ADMIN:");
        console.log("- ID:", user.id);
        console.log("- Nome:", user.nome);
        console.log("- Email:", user.email);
        console.log("- Role:", user.role);
        console.log("- Ativo:", user.active);

        console.log("\n🎉 PRONTO! Agora faça:");
        console.log("1. Logout no frontend");
        console.log("2. Login novamente");
        console.log("3. Deve ir para /admin automaticamente");

    } catch (error) {
        console.error("❌ Erro:", (error as Error).message);
        if ((error as Error).message.includes('user_role')) {
            console.log("💡 Possível problema: enum user_role não aceita 'admin'");
            console.log("Verifique se o enum no banco tem os valores corretos");
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
}

async function listAllUsers(): Promise<void> {
    try {
        console.log("👥 Listando TODOS os usuários com roles:");

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
            console.log(`   👤 Role: ${user.role} ${user.role === 'admin' ? '🚨' : '👤'}`);
            console.log(`   🟢 Ativo: ${user.active}`);
            console.log(`   📅 Criado: ${new Date(user.created_at).toLocaleString()}`);
        });

        const admins = rows.filter(u => u.role === 'admin');
        console.log(`\n📊 Resumo: ${rows.length} usuários total, ${admins.length} admin(s)`);

    } catch (error) {
        console.error("❌ Erro:", (error as Error).message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

async function checkEnumValues(): Promise<void> {
    try {
        console.log("🔍 Verificando valores do enum user_role...");

        const { rows } = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'user_role'
      )
    `);

        console.log("🎭 Valores permitidos no enum user_role:");
        rows.forEach(row => {
            console.log(`   - "${row.enumlabel}"`);
        });

        const hasAdmin = rows.some(row => row.enumlabel === 'admin');
        const hasUser = rows.some(row => row.enumlabel === 'user');

        console.log(`\n✅ Enum contém "admin": ${hasAdmin}`);
        console.log(`✅ Enum contém "user": ${hasUser}`);

        if (!hasAdmin) {
            console.log("❌ PROBLEMA: enum user_role NÃO tem 'admin'!");
            console.log("💡 Execute esta query no banco:");
            console.log("ALTER TYPE user_role ADD VALUE 'admin';");
        }

    } catch (error) {
        console.error("❌ Erro:", (error as Error).message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

const command = process.argv[2];

if (command === "check") {
    checkUserRole();
} else if (command === "make-admin") {
    makeUserAdmin();
} else if (command === "list") {
    listAllUsers();
} else if (command === "enum") {
    checkEnumValues();
} else {
    console.log("Usage:");
    console.log("ts-node scripts/checkRole.ts check      # Verificar role do admin");
    console.log("ts-node scripts/checkRole.ts make-admin # Transformar em admin");
    console.log("ts-node scripts/checkRole.ts list       # Listar todos usuários");
    console.log("ts-node scripts/checkRole.ts enum       # Verificar enum user_role");
    process.exit(1);
}