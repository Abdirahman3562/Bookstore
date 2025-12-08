import express from "express";
import {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  updateAuthorStatus,
  deleteAuthor
} from "../controllers/authors.controller.js";

const router = express.Router();

// GET /api/authors - Get all authors
router.get("/", getAllAuthors);

// GET /api/authors/:id - Get single author
router.get("/:id", getAuthorById);

// POST /api/authors - Create new author
router.post("/", createAuthor);

// PUT /api/authors/:id - Update author
router.put("/:id", updateAuthor);

// PATCH /api/authors/:id/status - Update author status
router.patch("/:id/status", updateAuthorStatus);

// DELETE /api/authors/:id - Delete author
router.delete("/:id", deleteAuthor);

export default router;




