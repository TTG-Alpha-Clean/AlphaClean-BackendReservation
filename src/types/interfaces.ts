// src/types/interfaces.ts
import { Request } from 'express';

// Estender Request do Express para incluir usuário autenticado
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: 'user' | 'admin';
    };
}

// Interface para configuração do banco
export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean;
}

// Interface para usuário
export interface User {
    id: string;
    nome: string;
    email: string;
    role: 'user' | 'admin';
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

// Interface para criação de usuário
export interface CreateUserData {
    nome: string;
    email: string;
    senha: string;
    role?: 'user' | 'admin';
    telefones?: Telefone[];
}

// Interface para telefone
export interface Telefone {
    ddd: string;
    numero: string;
    is_whatsapp: boolean;
}

// Interface para paginação
export interface PaginationResult<T> {
    data: T[];
    page: number;
    page_size: number;
    total: number;
}

// Interface para listagem de usuários
export interface ListUsersParams {
    page?: number;
    page_size?: number;
    active?: boolean;
    role?: string;
}

// Interface para agendamento
export interface Agendamento {
    id: string;
    usuario_id: string;
    modelo_veiculo: string;
    cor?: string;
    placa: string;
    servico_id: string;
    data: string;
    horario: string;
    status: 'agendado' | 'cancelado' | 'finalizado';
    observacoes?: string;
    created_at: Date;
    updated_at: Date;
}

// Interface para serviço
export interface Servico {
    id: string;
    nome: string;
    valor: number;
    ativo: boolean;
    created_at: Date;
    updated_at: Date;
}

// Interface para JWT payload
export interface JWTPayload {
    sub: string;
    role: 'user' | 'admin';
    iat: number;
    exp: number;
    nome?: string;
    email?: string;
}

// Interface para login
export interface LoginData {
    email: string;
    senha: string;
}

// Interface para resposta de login
export interface LoginResponse {
    token: string;
    user: Pick<User, 'id' | 'nome' | 'email' | 'role' | 'active'>;
}

// Tipos para status de agendamento
export type StatusAgendamento = 'agendado' | 'cancelado' | 'finalizado';

// Tipos para roles
export type UserRole = 'user' | 'admin';

// Interface para slots de horário
export interface TimeSlot {
    horario: string;
    ocupados: number;
    capacidade: number;
    disponivel: number;
}

// Interface para resposta de slots diários
export interface DailySlotsResponse {
    data: string;
    slots: TimeSlot[];
}

// Interface para API Error
export interface ApiErrorResponse {
    error: string;
    stack?: string;
    cause?: string;
}