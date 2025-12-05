import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  verifyEmail,
  loginUser,
  verifyUserLoginCode,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetUserPassword
} from "../controllers/users.controller.js";

const router = express.Router();

// POST /api/users/login - User login
router.post("/login", loginUser);

// POST /api/users/verify-login-code - Verify OTP code for 2-step verification
router.post("/verify-login-code", verifyUserLoginCode);

// POST /api/users/forgot-password - Send OTP for password reset
router.post("/forgot-password", sendPasswordResetOTP);

// POST /api/users/verify-reset-otp - Verify OTP for password reset
router.post("/verify-reset-otp", verifyPasswordResetOTP);

// POST /api/users/reset-password - Reset password with OTP
router.post("/reset-password", resetUserPassword);

// GET /api/users/verify-email - Verify email with token
router.get("/verify-email", verifyEmail);

// GET /api/users - Get all users
router.get("/", getAllUsers);

// POST /api/users - Create new user
router.post("/", createUser);

// GET /api/users/:id - Get single user
router.get("/:id", getUserById);

// PUT /api/users/:id - Update user
router.put("/:id", updateUser);

// PATCH /api/users/:id/status - Update user status
router.patch("/:id/status", updateUserStatus);

// DELETE /api/users/:id - Delete user
router.delete("/:id", deleteUser);

export default router;
