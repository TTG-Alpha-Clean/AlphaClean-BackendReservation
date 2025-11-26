"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.addService = addService;
exports.listServices = listServices;
exports.getService = getService;
exports.editService = editService;
exports.removeService = removeService;
exports.addServiceInformations = addServiceInformations;
const servicesService_1 = require("../services/servicesService");
// Helper for ID validation (numeric)
function isValidId(value) {
    const numericId = parseInt(value, 10);
    return !isNaN(numericId) && numericId > 0;
}
// CREATE
async function addService(req, res) {
    try {
        console.log('📝 CREATE SERVICE - Received data:', req.body);
        console.log('📷 File:', req.file ? 'YES' : 'NO');
        const newService = await (0, servicesService_1.createService)(req.body, req.file);
        console.log('✅ Service created:', newService);
        return res.status(201).json(newService);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('❌ Error creating service:', err);
        return res.status(500).json({ error: message });
    }
}
// READ - todos
async function listServices(_req, res) {
    try {
        const services = await (0, servicesService_1.getAllServices)();
        // Retorna com wrapper 'data' para consistência com a API
        return res.json({ data: services });
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
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'ID inválido. Deve ser um número positivo.' });
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
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'ID inválido. Deve ser um número positivo.' });
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
        if (!isValidId(id)) {
            return res.status(400).json({ error: 'ID inválido. Deve ser um número positivo.' });
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
// ADD INFORMATIONS
async function addServiceInformations(req, res) {
    try {
        const serviceId = req.params.id;
        if (!isValidId(serviceId)) {
            return res.status(400).json({ error: 'ID inválido. Deve ser um número positivo.' });
        }
        const { informations } = req.body;
        if (!Array.isArray(informations) || informations.length === 0) {
            return res.status(400).json({ error: 'Informações inválidas' });
        }
        const { createServiceInformations } = await Promise.resolve().then(() => __importStar(require('../services/servicesService')));
        const result = await createServiceInformations(serviceId, informations);
        return res.status(201).json(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        return res.status(500).json({ error: message });
    }
}
//# sourceMappingURL=servicesController.js.map