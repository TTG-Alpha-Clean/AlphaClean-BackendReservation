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
exports.setRole = exports.setActive = exports.getById = exports.list = exports.me = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const userSvc = __importStar(require("../services/userService"));
const userValidators_1 = require("../utils/userValidators");
exports.me = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const me = await userSvc.getById(req.user.id);
    res.json(me);
});
exports.list = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const { page = "1", page_size = "20", active, role } = req.query;
    const result = await userSvc.list({
        page: Number(page),
        page_size: Math.min(Number(page_size), 100),
        active: active === undefined ? undefined : (active === "true"),
        role: role || undefined
    });
    res.json(result);
});
exports.getById = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const u = await userSvc.getById(req.params.id);
    if (!u) {
        return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json(u);
});
exports.setActive = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const u = await userSvc.setActive(req.params.id, !!req.body.active);
    res.json(u);
});
exports.setRole = (0, asyncHandler_1.authenticatedHandler)(async (req, res) => {
    const { role } = req.body || {};
    (0, userValidators_1.validateRole)(role);
    const u = await userSvc.updateRole(req.params.id, role);
    res.json(u);
});
//# sourceMappingURL=userController.js.map