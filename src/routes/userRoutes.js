import { Router } from "express"
import * as users from "../controllers/userController.js"
import { requireUser, requireAdmin } from "../middlewares/auth.js"

const router = Router()

router.get("/me", requireUser, users.me)
router.get("/", requireUser, requireAdmin, users.list)
router.get("/:id", requireUser, requireAdmin, users.getById)
router.patch("/:id/active", requireUser, requireAdmin, users.setActive)
router.patch("/:id/role", requireUser, requireAdmin, users.setRole)

export default router
