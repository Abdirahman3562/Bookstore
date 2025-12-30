import express from "express";
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  updateBlogStatus,
  deleteBlog,
  deleteComment
} from "../controllers/blogs.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant middleware to all blog routes
router.use(resolveTenant);
router.use(requireTenant);
router.use(checkTenantAccess);

// GET /api/blogs - Get all blogs
router.get("/", getAllBlogs);

// GET /api/blogs/:id - Get single blog
router.get("/:id", getBlogById);

// POST /api/blogs - Create new blog
router.post("/", createBlog);

// PUT /api/blogs/:id - Update blog
router.put("/:id", updateBlog);

// PATCH /api/blogs/:id/status - Update blog status
router.patch("/:id/status", updateBlogStatus);

// DELETE /api/blogs/:blogId/comments/:commentId/replies/:replyId - Delete reply (must come before comment route)
router.delete("/:blogId/comments/:commentId/replies/:replyId", deleteComment);

// DELETE /api/blogs/:blogId/comments/:commentId - Delete comment
router.delete("/:blogId/comments/:commentId", deleteComment);

// DELETE /api/blogs/:id - Delete blog (must come last to avoid conflicts)
router.delete("/:id", deleteBlog);

export default router;

