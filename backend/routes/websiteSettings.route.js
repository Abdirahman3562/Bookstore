import express from "express";
import { getWebsiteSettings, updateWebsiteSettings, uploadLogo } from "../controllers/websiteSettings.controller.js";

const router = express.Router();

// GET website settings
router.get("/", getWebsiteSettings);

// UPDATE website settings (with logo upload)
router.put("/", uploadLogo.single("logo"), updateWebsiteSettings);

export default router;




