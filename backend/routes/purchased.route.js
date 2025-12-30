import express from "express";
import {
  getAllPurchased,
  getPurchasedById,
  createPurchased,
  updatePurchased,
  deletePurchased,
  updateOrderStatus
} from "../controllers/purchased.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant middleware to all purchased routes
router.use(resolveTenant);
router.use(requireTenant);
router.use(checkTenantAccess);

// GET /api/purchased - Get all purchased items
router.get("/", getAllPurchased);

// GET /api/purchased/:id - Get single purchased item
router.get("/:id", getPurchasedById);

// POST /api/purchased - Create new purchased item
router.post("/", createPurchased);

// PUT /api/purchased/:id - Update purchased item
router.put("/:id", updatePurchased);

// PUT /api/purchased/:id/status - Update order status
router.put("/:id/status", updateOrderStatus);

// DELETE /api/purchased/:id - Delete purchased item
router.delete("/:id", deletePurchased);

export default router;
