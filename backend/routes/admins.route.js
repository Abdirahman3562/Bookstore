import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import {
  getAllAdmins,
  getAdminById,
  getCurrentAdminProfile,
  updateCurrentAdminProfile,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from "../controllers/admins.controller.js";

const router = express.Router();

// For admin permission checking, use a simplified auth check
// Allow access for authenticated admins regardless of tenant context
router.use(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");
    const admin = await Admin.findById(decoded.id);

    if (admin) {
      req.admin = admin;
      req.isSuperAdmin = admin.adminRole === 'SUPER_ADMIN';
      req.user = admin; // Set user for compatibility
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
});

// GET /api/admins - Get all admins
router.get("/", getAllAdmins);

// GET /api/admins/profile - Get current admin profile (with password)
router.get("/profile", getCurrentAdminProfile);

// PUT /api/admins/profile - Update current admin profile
router.put("/profile", updateCurrentAdminProfile);

// GET /api/admins/:id - Get single admin
router.get("/:id", getAdminById);

// POST /api/admins - Create new admin
router.post("/", createAdmin);

// PUT /api/admins/:id - Update admin
router.put("/:id", updateAdmin);

// DELETE /api/admins/:id - Delete admin
router.delete("/:id", deleteAdmin);

export default router;

