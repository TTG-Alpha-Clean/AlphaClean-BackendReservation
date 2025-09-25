// src/utils/userValidators.ts - VERSÃO TYPESCRIPT
import ApiError from "./apiError";

const EMAIL_RX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const DDD_RX = /^[0-9]{2}$/;
const NUM_RX = /^9[0-9]{8}$/;

// Interface para telefone
interface TelefoneInput {
    ddd?: string;
    numero?: string;
    is_whatsapp?: boolean;
}

interface TelefoneOutput {
    ddd: string;
    numero: string;
    is_whatsapp: boolean;
}

// Interface para dados de registro
interface RegisterInput {
    nome?: string;
    email?: string;
    senha?: string;
    telefones?: TelefoneInput[];
    role?: string;
}

interface RegisterOutput {
    nome: string;
    email: string;
    senha: string;
    telefones: TelefoneOutput[];
    role?: string;
}

// Interface para dados de login
interface LoginInput {
    email?: string;
    senha?: string;
}

interface LoginOutput {
    email: string;
    senha: string;
}

export function validateRegister(body: RegisterInput): RegisterOutput {
    const { nome, email, senha, telefones } = body || {};

    if (!nome || String(nome).trim().length < 2) {
        throw new ApiError(400, "nome deve ter pelo menos 2 caracteres");
    }

    if (!email || !EMAIL_RX.test(String(email))) {
        throw new ApiError(400, "email inválido");
    }

    if (!senha || String(senha).length < 6) {
        throw new ApiError(400, "senha deve ter pelo menos 6 caracteres");
    }

    let tels: TelefoneOutput[] = [];
    if (Array.isArray(telefones) && telefones.length > 0) {
        tels = telefones
            .filter(t => t.ddd && t.numero) // Filtra telefones vazios
            .map(t => ({
                ddd: String(t.ddd || ""),
                numero: String(t.numero || ""),
                is_whatsapp: !!t.is_whatsapp,
            }));

        for (const t of tels) {
            if (!DDD_RX.test(t.ddd) || t.ddd === "00") {
                throw new ApiError(400, "DDD inválido");
            }
            if (!NUM_RX.test(t.numero)) {
                throw new ApiError(400, "número inválido (formato 9XXXXXXXX)");
            }
        }
    }

    const role = body?.role ? String(body.role).toLowerCase() : undefined; // "admin" ou "user"

    return {
        nome: String(nome).trim(),
        email: String(email).toLowerCase(),
        senha: String(senha),
        telefones: tels,
        role, // retorna role se enviado
    };
}

export function validateLogin(body: LoginInput): LoginOutput {
    const { email, senha } = body || {};

    if (!email || !EMAIL_RX.test(String(email))) {
        throw new ApiError(400, "email inválido");
    }

    if (!senha) {
        throw new ApiError(400, "senha obrigatória");
    }

    return {
        email: String(email).toLowerCase(),
        senha: String(senha)
    };
}

export function validateRole(role: string): void {
    const allowed = ["user", "admin"];
    if (!allowed.includes(role)) {
        throw new ApiError(400, `role inválida. Use: ${allowed.join(", ")}`);
    }
}