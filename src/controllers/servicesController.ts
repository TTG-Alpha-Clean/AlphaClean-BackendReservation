import { Request, Response } from 'express';
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
} from '../services/servicesService';

// Interface for multer file support
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Helper for UUID validation
function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// CREATE
export async function addService(req: MulterRequest, res: Response): Promise<Response> {
  try {
    const newService = await createService(req.body, req.file);
    return res.status(201).json(newService);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: message });
  }
}

// READ - todos
export async function listServices(_req: Request, res: Response): Promise<Response> {
  try {
    const services = await getAllServices();
    return res.json(services);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: message });
  }
}

// READ - por ID
export async function getService(req: Request, res: Response): Promise<Response> {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: 'ID inválido. Deve ser um UUID válido.' });
    }

    const service = await getServiceById(id);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    return res.json(service);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: message });
  }
}

// UPDATE
export async function editService(req: MulterRequest, res: Response): Promise<Response> {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: 'ID inválido. Deve ser um UUID válido.' });
    }

    const updated = await updateService(id, req.body, req.file);
    if (!updated) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: message });
  }
}

// DELETE
export async function removeService(req: Request, res: Response): Promise<Response> {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: 'ID inválido. Deve ser um UUID válido.' });
    }

    const deleted = await deleteService(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }
    return res.json({ message: 'Serviço excluído com sucesso', service: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: message });
  }
}