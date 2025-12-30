import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  createUser,
  verifyEmail,
  loginUser,
  verifyUserLoginCode,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetUserPassword
} from "../controllers/users.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant resolution for user creation (but not require tenant since users might sign up)
router.post("/", resolveTenant, createUser);

// POST /api/users/login - User login
router.post("/login", loginUser);

// POST /api/users/verify-login-code - Verify login code (2-step verification)
router.post("/verify-login-code", verifyUserLoginCode);

// POST /api/users/forgot-password - Send password reset OTP
router.post("/forgot-password", sendPasswordResetOTP);

// POST /api/users/verify-reset-otp - Verify password reset OTP
router.post("/verify-reset-otp", verifyPasswordResetOTP);

// POST /api/users/reset-password - Reset user password
router.post("/reset-password", resetUserPassword);

// GET /api/users/verify-email - Verify user email (must be before /:id route)
router.get("/verify-email", verifyEmail);

// Apply tenant middleware to admin routes
const adminRoutes = express.Router();
adminRoutes.use(resolveTenant);
adminRoutes.use(requireTenant);
adminRoutes.use(checkTenantAccess);

// GET /api/users - Get all users
adminRoutes.get("/", getAllUsers);

// GET /api/users/:id - Get single user (must be last to avoid conflicts)
adminRoutes.get("/:id", getUserById);

// PUT /api/users/:id - Update user
adminRoutes.put("/:id", updateUser);

// PATCH /api/users/:id/status - Update user status
adminRoutes.patch("/:id/status", updateUserStatus);

// DELETE /api/users/:id - Delete user
adminRoutes.delete("/:id", deleteUser);

// Mount admin routes
router.use("/", adminRoutes);

export default router;
