// src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/interfaces';

// Tipo para handlers que podem receber Request normal ou AuthenticatedRequest
type AsyncHandlerFunction = (
    req: Request | AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => Promise<any>;

// Tipo específico para handlers autenticados
type AuthenticatedHandlerFunction = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => Promise<any>;

// AsyncHandler genérico
export function asyncHandler(fn: AsyncHandlerFunction) {
    return (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// AsyncHandler específico para rotas autenticadas
export function authenticatedHandler(fn: AuthenticatedHandlerFunction) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Exportação padrão (compatível com JS)
export default asyncHandler;