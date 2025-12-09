import express from "express";
import {
  getAllUsers,
  getUserById,
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

const router = express.Router();

// POST /api/users - Create new user (signup)
router.post("/", createUser);

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

// GET /api/users - Get all users
router.get("/", getAllUsers);

// GET /api/users/:id - Get single user (must be last to avoid conflicts)
router.get("/:id", getUserById);

// PATCH /api/users/:id/status - Update user status
router.patch("/:id/status", updateUserStatus);

// DELETE /api/users/:id - Delete user
router.delete("/:id", deleteUser);

export default router;
