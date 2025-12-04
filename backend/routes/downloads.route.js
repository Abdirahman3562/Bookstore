import express from "express";
import {
  getAllDownloads,
  getDownloadById,
  createDownload,
  updateDownload,
  updateDownloadAccess,
  deleteDownload
} from "../controllers/downloads.controller.js";

const router = express.Router();

// GET /api/downloads - Get all downloads
router.get("/", getAllDownloads);

// GET /api/downloads/:id - Get single download
router.get("/:id", getDownloadById);

// POST /api/downloads - Create new download
router.post("/", createDownload);

// PUT /api/downloads/:id - Update download
router.put("/:id", updateDownload);

// PATCH /api/downloads/:id/access - Update download access (revoke/allow)
router.patch("/:id/access", updateDownloadAccess);

// DELETE /api/downloads/:id - Delete download
router.delete("/:id", deleteDownload);

export default router;
