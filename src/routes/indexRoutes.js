import { Router } from "express"
import userRoutes from "./userRoutes.js"
import agendamentosRoutes from "./agendamentos/index.js"
import authRoutes from "./authRoutes.js"

const router = Router()

router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/agendamentos", agendamentosRoutes)

export default router
