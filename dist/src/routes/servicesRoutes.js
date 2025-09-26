"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const servicesController_1 = require("../controllers/servicesController");
const upload_1 = __importDefault(require("../middlewares/upload"));
const router = (0, express_1.Router)();
// Public route (for customers to see available services)
router.get('/', servicesController_1.listServices);
// Admin routes (require authentication)
router.get('/:id', auth_1.requireUser, auth_1.requireAdmin, servicesController_1.getService);
router.post('/', auth_1.requireUser, auth_1.requireAdmin, upload_1.default.single("image"), servicesController_1.addService);
router.put('/:id', auth_1.requireUser, auth_1.requireAdmin, upload_1.default.single("image"), servicesController_1.editService);
router.delete('/:id', auth_1.requireUser, auth_1.requireAdmin, servicesController_1.removeService);
exports.default = router;
//# sourceMappingURL=servicesRoutes.js.map