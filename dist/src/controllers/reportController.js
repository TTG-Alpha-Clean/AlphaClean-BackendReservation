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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyRevenue = getMonthlyRevenue;
exports.getTopServices = getTopServices;
exports.getTopClients = getTopClients;
exports.getGeneralStats = getGeneralStats;
const reportService = __importStar(require("../services/reportService"));
const apiError_1 = __importDefault(require("../utils/apiError"));
async function getMonthlyRevenue(req, res) {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        if (isNaN(year) || year < 2000 || year > 2100) {
            throw new apiError_1.default(400, "Ano inválido");
        }
        const data = await reportService.getMonthlyRevenue(year);
        res.json({
            success: true,
            year,
            data
        });
    }
    catch (error) {
        if (error instanceof apiError_1.default) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            console.error("Erro ao buscar receita mensal:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar receita mensal"
            });
        }
    }
}
async function getTopServices(req, res) {
    try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        if (year && (isNaN(year) || year < 2000 || year > 2100)) {
            throw new apiError_1.default(400, "Ano inválido");
        }
        const data = await reportService.getTopServices(year);
        res.json({
            success: true,
            year: year || 'todos',
            data
        });
    }
    catch (error) {
        if (error instanceof apiError_1.default) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            console.error("Erro ao buscar top serviços:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar top serviços"
            });
        }
    }
}
async function getTopClients(req, res) {
    try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        if (year && (isNaN(year) || year < 2000 || year > 2100)) {
            throw new apiError_1.default(400, "Ano inválido");
        }
        if (isNaN(limit) || limit < 1 || limit > 100) {
            throw new apiError_1.default(400, "Limite inválido (1-100)");
        }
        const data = await reportService.getTopClients(year, limit);
        res.json({
            success: true,
            year: year || 'todos',
            data
        });
    }
    catch (error) {
        if (error instanceof apiError_1.default) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            console.error("Erro ao buscar top clientes:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar top clientes"
            });
        }
    }
}
async function getGeneralStats(req, res) {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        if (isNaN(year) || year < 2000 || year > 2100) {
            throw new apiError_1.default(400, "Ano inválido");
        }
        const data = await reportService.getGeneralStats(year);
        res.json({
            success: true,
            year,
            data
        });
    }
    catch (error) {
        if (error instanceof apiError_1.default) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            });
        }
        else {
            console.error("Erro ao buscar estatísticas gerais:", error);
            res.status(500).json({
                success: false,
                error: "Erro ao buscar estatísticas gerais"
            });
        }
    }
}
//# sourceMappingURL=reportController.js.map