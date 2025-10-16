// src/controllers/userController.ts - CORRIGIDO E COMPLETO
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/interfaces';
import { authenticatedHandler } from '../utils/asyncHandler';
import * as userSvc from "../services/userService";
import { validateRole } from "../utils/userValidators";

export const me = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const me = await userSvc.getById(req.user!.id);
    res.json(me);
});

export const list = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = "1", page_size = "20", role } = req.query;

    const result = await userSvc.list({
        page: Number(page),
        page_size: Math.min(Number(page_size), 100),
        role: (role as string) || undefined
    });

    res.json(result);
});

export const getById = authenticatedHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const u = await userSvc.getById(req.params.id);
    if (!u) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
    }
    res.json(u);
});

export const setActive = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const u = await userSvc.setActive(req.params.id, !!req.body.active);
    res.json(u);
});

export const setRole = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { role } = req.body || {};
    validateRole(role);
    const u = await userSvc.updateRole(req.params.id, role);
    res.json(u);
});

export const updateProfile = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { telefone } = req.body;

    if (!telefone || typeof telefone !== 'string') {
        res.status(400).json({ error: 'Telefone é obrigatório' });
        return;
    }

    const updatedUser = await userSvc.updateProfile(req.user!.id, { telefone });
    res.json({ user: updatedUser });
});

export const updatePassword = authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
        return;
    }

    if (newPassword.length < 6) {
        res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
        return;
    }

    await userSvc.updatePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Senha atualizada com sucesso' });
});