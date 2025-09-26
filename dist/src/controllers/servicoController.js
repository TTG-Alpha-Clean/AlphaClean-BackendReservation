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
exports.deleteServico = exports.updateServico = exports.createServico = exports.getServico = exports.listServicos = void 0;
const servicoSvc = __importStar(require("../services/servicoService"));
// Helper para async handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.listServicos = asyncHandler(async (req, res) => {
    const { ativo } = req.query;
    const incluirInativos = ativo === "false" || ativo === "all";
    const servicos = await servicoSvc.listServicos({
        ativo: incluirInativos ? undefined : true
    });
    res.json({ data: servicos });
});
exports.getServico = asyncHandler(async (req, res) => {
    const servico = await servicoSvc.getServicoById(req.params.id);
    if (!servico) {
        return res.status(404).json({ error: "Serviço não encontrado" });
    }
    res.json(servico);
});
exports.createServico = asyncHandler(async (req, res) => {
    const { nome, valor } = req.body;
    if (!nome || valor === undefined) {
        return res.status(400).json({ error: "Nome e valor são obrigatórios" });
    }
    const servico = await servicoSvc.createServico({ nome, valor });
    res.status(201).json(servico);
});
exports.updateServico = asyncHandler(async (req, res) => {
    const { nome, valor, ativo } = req.body;
    const servico = await servicoSvc.updateServico(req.params.id, { nome, valor, ativo });
    res.json(servico);
});
exports.deleteServico = asyncHandler(async (req, res) => {
    const result = await servicoSvc.deleteServico(req.params.id);
    res.json(result);
});
//# sourceMappingURL=servicoController.js.map