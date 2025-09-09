// src/routes/authRoutes.ts
import { Router } from "express";
import * as auth from "../controllers/authController";

const router = Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.get("/me", auth.me);
router.post("/logout", auth.logout);

export default router;