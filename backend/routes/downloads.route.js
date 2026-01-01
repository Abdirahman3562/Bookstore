import express from "express";
import {
  getAllDownloads,
  getDownloadById,
  createDownload,
  updateDownload,
  updateDownloadAccess,
  deleteDownload
} from "../controllers/downloads.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant middleware to all download routes
router.use(async (req, res, next) => {
  if (req.headers.host && req.headers.host.includes('localhost')) {
    req.tenantId = '6953b1f351551dd25f2ed2d9'; // samafale tenant ID
    req.tenant = { _id: '6953b1f351551dd25f2ed2d9', name: 'samafale' };
    return next();
  }
  resolveTenant(req, res, () => {
    requireTenant(req, res, () => {
      checkTenantAccess(req, res, next);
    });
  });
});

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
