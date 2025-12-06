import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  sendReplyEmail
} from "../controllers/contact.controller.js";

const router = express.Router();

// POST /api/contacts - Create new contact message (requires login)
router.post("/", createContact);

// POST /api/contacts/reply - Send reply email (for admin)
router.post("/reply", sendReplyEmail);

// GET /api/contacts - Get all contacts (for admin)
router.get("/", getAllContacts);

// GET /api/contacts/:id - Get single contact
router.get("/:id", getContactById);

// PATCH /api/contacts/:id/status - Update contact status (for admin)
router.patch("/:id/status", updateContactStatus);

// DELETE /api/contacts/:id - Delete contact (for admin)
router.delete("/:id", deleteContact);

export default router;

