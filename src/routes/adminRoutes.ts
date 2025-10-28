import { Router } from 'express';
import { adminLogin, adminLogout } from '../controllers/adminControllers';
import { executeAutoFinalizacao } from '../services/autoFinalizacaoService';
import { authenticatedHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/interfaces';
import { Response } from 'express';

const router = Router();
router.post('/login', adminLogin);
router.post('/logout', adminLogout);

// Rota para executar manualmente a finalização automática de agendamentos
router.post('/auto-finalize', authenticatedHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Verificar se é admin
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Apenas administradores podem executar esta ação' });
        return;
    }

    const result = await executeAutoFinalizacao();
    res.json(result);
}));

export default router;
