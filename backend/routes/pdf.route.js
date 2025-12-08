import express from "express";
import { getProtectedPDF } from "../controllers/pdf.controller.js";

const router = express.Router();

// Protected PDF route - requires user authentication
router.get("/:filename", getProtectedPDF);

export default router;




