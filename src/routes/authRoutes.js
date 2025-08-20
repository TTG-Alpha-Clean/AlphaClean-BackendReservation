import { Router } from "express"
import * as auth from "../controllers/authController.js"

const router = Router()

router.post("/register", auth.register)
router.post("/login", auth.login)
router.get("/me", auth.me)         // Nova rota
router.post("/logout", auth.logout) // Nova rota

export default router