// src/routes/authRoutes.ts
import { Router } from "express";
import * as auth from "../controllers/authController";
import * as passwordReset from "../controllers/passwordResetController";
import * as healthCheck from "../controllers/healthCheckController";

const router = Router();

// Autenticação
router.post("/register", auth.register);
router.post("/login", auth.login);
router.get("/me", auth.me);
router.post("/logout", auth.logout);

// Recuperação de senha
router.post("/forgot-password", passwordReset.forgotPassword);
router.post("/reset-password", passwordReset.resetPassword);
router.get("/verify-reset-token/:token", passwordReset.verifyResetToken);

// Health check do sistema de reset
router.get("/health-check-reset", healthCheck.healthCheckReset);

export default router;