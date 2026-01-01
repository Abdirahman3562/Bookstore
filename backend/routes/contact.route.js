import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  sendReplyEmail
} from "../controllers/contact.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply tenant middleware to all contact routes
router.use(resolveTenant);
router.use(requireTenant);

// POST /api/contacts - Create new contact message (public)
router.post("/", createContact);

// POST /api/contacts/reply - Send reply email (admin only)
router.post("/reply", requireAuth, checkTenantAccess, sendReplyEmail);

// GET /api/contacts - Get all contacts (admin only)
router.get("/", requireAuth, checkTenantAccess, getAllContacts);

// GET /api/contacts/:id - Get single contact (admin only)
router.get("/:id", requireAuth, checkTenantAccess, getContactById);

// PATCH /api/contacts/:id/status - Update contact status (admin only)
router.patch("/:id/status", requireAuth, checkTenantAccess, updateContactStatus);

// DELETE /api/contacts/:id - Delete contact (admin only)
router.delete("/:id", requireAuth, checkTenantAccess, deleteContact);

export default router;

