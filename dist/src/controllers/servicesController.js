"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addService = addService;
exports.listServices = listServices;
exports.getService = getService;
exports.editService = editService;
exports.removeService = removeService;
const servicesService_1 = require("../services/servicesService");
// Helper for UUID validation
function isValidUuid(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}
// CREATE
async function addService(req, res) {
    try {
        const newService = await (0, servicesService_1.createService)(req.body, req.file);
        return res.status(201).json(newService);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return res.status(500).json({ error: message });
    }
}
// READ - todos
async function listServices(_req, res) {
    try {
        const services = await (0, servicesService_1.getAllServices)();
        return res.json(services);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return res.status(500).json({ error: message });
    }
}
// READ - por ID
async function getService(req, res) {
    try {
        const id = req.params.id;
        if (!isValidUuid(id)) {
            return res.status(400).json({ error: 'ID inválido. Deve ser um UUID válido.' });
        }
        const service = await (0, servicesService_1.getServiceById)(id);
        if (!service) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        return res.json(service);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return res.status(500).json({ error: message });
    }
}
// UPDATE
async function editService(req, res) {
    try {
        const id = req.params.id;
        if (!isValidUuid(id)) {
            return res.status(400).json({ error: 'ID inválido. Deve ser um UUID válido.' });
        }
        const updated = await (0, servicesService_1.updateService)(id, req.body, req.file);
        if (!updated) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        return res.json(updated);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return res.status(500).json({ error: message });
    }
}
// DELETE
async function removeService(req, res) {
    try {
        const id = req.params.id;
        if (!isValidUuid(id)) {
            return res.status(400).json({ error: 'ID inválido. Deve ser um UUID válido.' });
        }
        const deleted = await (0, servicesService_1.deleteService)(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }
        return res.json({ message: 'Serviço excluído com sucesso', service: deleted });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return res.status(500).json({ error: message });
    }
}
//# sourceMappingURL=servicesController.js.map