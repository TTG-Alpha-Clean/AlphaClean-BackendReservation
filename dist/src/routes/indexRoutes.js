"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/indexRoutes.ts
const express_1 = require("express");
const userRoutes_1 = __importDefault(require("./userRoutes"));
const agendamentoRoutes_1 = __importDefault(require("./agendamentoRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const router = (0, express_1.Router)();
router.use("/auth", authRoutes_1.default);
router.use("/users", userRoutes_1.default);
router.use("/agendamentos", agendamentoRoutes_1.default);
exports.default = router;
//# sourceMappingURL=indexRoutes.js.map