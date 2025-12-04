import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
} from "../controllers/users.controller.js";

const router = express.Router();

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
