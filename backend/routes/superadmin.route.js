import express from "express";
import { getDashboardStats, createAdmin, getAllAdmins } from "../controllers/superadmin.controller.js";
import { requireSuperAdmin } from "../middleware/tenant.middleware.js";
import realtimeMonitor from "../utils/realtimeSubscriptionMonitor.js";
import plansRouter from "./plans.route.js";

const router = express.Router();

// All routes require SUPER_ADMIN
router.use(requireSuperAdmin);

// Dashboard stats
router.get("/dashboard", getDashboardStats);

// Subscription monitoring
router.post("/subscriptions/check-expiry", async (req, res) => {
  try {
    await realtimeMonitor.checkNow();
    res.json({
      success: true,
      message: "Subscription expiry check completed"
    });
  } catch (error) {
    console.error("Error checking subscription expiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check subscription expiry"
    });
  }
});

router.get("/subscriptions/monitor-status", (req, res) => {
  const status = realtimeMonitor.getStatus();
  res.json({
    success: true,
    data: status
  });
});

// Test payment creation endpoint
router.post("/test-payment", async (req, res) => {
  try {
    const Payment = (await import("../models/payment.model.js")).default;

    const testPayment = await Payment.create({
      tenantId: req.body.tenantId || "507f1f77bcf86cd799439011", // Dummy ObjectId
      subscriptionId: req.body.subscriptionId || "507f1f77bcf86cd799439011",
      amount: req.body.amount || 50,
      currency: req.body.currency || 'USD',
      type: 'subscription',
      status: 'completed',
      billingPeriod: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      planDetails: {
        planName: 'Test Plan',
        billingCycle: 'monthly',
        originalPrice: req.body.amount || 50
      },
      paymentDate: new Date(),
      processedDate: new Date()
    });

    res.json({
      success: true,
      message: "Test payment created",
      payment: testPayment
    });
  } catch (error) {
    console.error("Test payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create test payment",
      error: error.message
    });
  }
});

// Admin management
router.post("/admins", createAdmin);
router.get("/admins", getAllAdmins);

// Plans management
router.use("/plans", plansRouter);

export default router;

