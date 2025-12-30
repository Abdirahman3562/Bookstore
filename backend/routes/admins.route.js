import express from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from "../controllers/admins.controller.js";

const router = express.Router();

// Apply optional auth to all admin routes to set req.admin
router.use(optionalAuth);

// GET /api/admins - Get all admins
router.get("/", getAllAdmins);

// GET /api/admins/:id - Get single admin
router.get("/:id", getAdminById);

// POST /api/admins - Create new admin
router.post("/", createAdmin);

// PUT /api/admins/:id - Update admin
router.put("/:id", updateAdmin);

// DELETE /api/admins/:id - Delete admin
router.delete("/:id", deleteAdmin);

export default router;

