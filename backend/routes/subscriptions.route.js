import express from "express";
import {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription,
  getExpiringSubscriptions
} from "../controllers/subscriptions.controller.js";
import { requireSuperAdmin } from "../middleware/tenant.middleware.js";

const router = express.Router();

// All routes require SUPER_ADMIN
router.use(requireSuperAdmin);

// Subscription management routes
router.get("/", getAllSubscriptions);
router.get("/expiring", getExpiringSubscriptions);
router.get("/:id", getSubscriptionById);
router.post("/", createSubscription);
router.put("/:id", updateSubscription);
router.put("/:id/renew", renewSubscription);
router.put("/:id/cancel", cancelSubscription);

export default router;



