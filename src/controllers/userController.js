import asyncHandler from "../utils/asyncHandler.js"
import * as userSvc from "../services/userService.js"
import { validateRole } from "../utils/userValidators.js"

export const me = asyncHandler(async (req, res) => {
    const me = await userSvc.getById(req.user.id)
    res.json(me)
})

export const list = asyncHandler(async (req, res) => {
    const { page = 1, page_size = 20, active, role } = req.query
    const result = await userSvc.list({
        page: Number(page), page_size: Math.min(Number(page_size), 100),
        active: active === undefined ? undefined : (active === "true"),
        role: role || undefined
    })
    res.json(result)
})

export const getById = asyncHandler(async (req, res) => {
    const u = await userSvc.getById(req.params.id)
    if (!u) return res.status(404).json({ error: "Usuário não encontrado" })
    res.json(u)
})

export const setActive = asyncHandler(async (req, res) => {
    const u = await userSvc.setActive(req.params.id, !!req.body.active)
    res.json(u)
})

export const setRole = asyncHandler(async (req, res) => {
    const { role } = req.body || {}
    validateRole(role)
    const u = await userSvc.updateRole(req.params.id, role)
    res.json(u)
})
