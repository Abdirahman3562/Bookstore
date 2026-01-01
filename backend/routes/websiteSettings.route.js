import express from "express";
import { getWebsiteSettings, updateWebsiteSettings, uploadLogo } from "../controllers/websiteSettings.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply tenant middleware to all website settings routes
router.use(resolveTenant);
router.use(requireTenant);
router.use(checkTenantAccess);

// GET website settings (authenticated users only)
router.get("/", requireAuth, getWebsiteSettings);

// UPDATE website settings (admin only)
router.put("/", requireAuth, uploadLogo.single("logo"), updateWebsiteSettings);

export default router;






