import express from "express";
import { getWebsiteSettings, updateWebsiteSettings, uploadLogo } from "../controllers/websiteSettings.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant middleware to all website settings routes
router.use(resolveTenant);
router.use(requireTenant);
router.use(checkTenantAccess);

// GET website settings
router.get("/", getWebsiteSettings);

// UPDATE website settings (with logo upload)
router.put("/", uploadLogo.single("logo"), updateWebsiteSettings);

export default router;






