"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminControllers_1 = require("../controllers/adminControllers");
const router = (0, express_1.Router)();
router.post('/login', adminControllers_1.adminLogin);
router.post('/logout', adminControllers_1.adminLogout);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map