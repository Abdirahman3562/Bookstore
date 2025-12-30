import Subscription from "../models/subscription.model.js";
import Tenant from "../models/tenant.model.js";
import { sendSubscriptionCancelledNotification, sendSubscriptionRenewedNotification } from "../utils/emailService.js";

let Payment;
try {
  Payment = (await import("../models/payment.model.js")).default;
  console.log("✅ Payment model imported successfully");
} catch (error) {
  console.error("❌ Failed to import Payment model:", error);
  Payment = null;
}

/**
 * Get all subscriptions (Super Admin only)
 */
export const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tenantId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (tenantId) query.tenantId = tenantId;

    const subscriptions = await Subscription.find(query)
      .populate('tenantId', 'name contactEmail status')
      .populate('planId', 'name key price currency billingCycle limits')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subscriptions",
      error: error.message
    });
  }
};

/**
 * Get subscription by ID
 */
export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id)
      .populate('tenantId', 'name contactEmail status subdomain domain')
      .populate('planId', 'name key price currency billingCycle limits');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subscription",
      error: error.message
    });
  }
};

/**
 * Create subscription
 */
export const createSubscription = async (req, res) => {
  try {
    const {
      tenantId,
      planId,
      startDate,
      endDate,
      autoRenew = true,
      notes = ""
    } = req.body;

    console.log("Creating subscription with data:", { tenantId, planId, startDate, endDate, autoRenew, notes });

    if (!tenantId || !planId || !startDate || !endDate) {
      console.log("Validation failed: missing required fields");
      return res.status(400).json({
        success: false,
        message: "Tenant ID, plan ID, start date, and end date are required"
      });
    }

    // Check if tenant exists
    console.log("Checking tenant:", tenantId);
    const tenant = await Tenant.findById(tenantId);
    console.log("Found tenant:", tenant ? "Yes" : "No");
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Check if plan exists
    console.log("Checking plan:", planId);
    const Plan = (await import('../models/plans.model.js')).default;
    // Try to find by _id first (if planId is a valid ObjectId), then by key
    let plan;
    if (planId.match(/^[0-9a-fA-F]{24}$/)) {
      // Looks like a valid ObjectId
      plan = await Plan.findById(planId);
      console.log("Found plan by _id:", plan ? "Yes" : "No");
    }
    if (!plan) {
      plan = await Plan.findOne({ key: planId });
      console.log("Found plan by key:", plan ? "Yes" : "No");
    }
    if (!plan) {
      console.log("Plan not found for key:", planId);
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }
    console.log("Using plan:", plan.name, "with _id:", plan._id, "key:", plan.key);

    // Cancel existing active subscriptions
    console.log("Cancelling existing subscriptions for tenant:", tenantId);
    await Subscription.updateMany(
      { tenantId, status: 'active' },
      { status: 'cancelled' }
    );

    // Create new subscription
    console.log("Creating subscription with plan _id:", plan._id);
    const subscriptionData = {
      tenantId,
      planId: plan._id, // Use the plan's MongoDB _id, not the key from frontend
      plan: plan.key,
      planName: plan.name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      autoRenew,
      limits: plan.limits,
      notes,
      status: 'active'
    };
    console.log("Subscription data:", subscriptionData);

    const subscription = await Subscription.create(subscriptionData);
    console.log("Subscription created successfully:", subscription._id);

    // Update tenant status to active
    try {
      tenant.status = 'active';
      await tenant.save();
      console.log("Tenant status updated to active");
    } catch (tenantError) {
      console.error("Error updating tenant status:", tenantError);
      // Don't fail the whole operation if tenant update fails
    }

    // Record payment for the subscription (if it's not free)
    console.log("Checking payment creation - plan.price:", plan.price, "type:", typeof plan.price, "Payment model:", Payment ? "available" : "null");
    if (plan.price > 0 && Payment) {
      console.log("Creating payment for subscription:", subscription._id, "amount:", plan.price);
      try {
        const paymentData = {
          tenantId,
          subscriptionId: subscription._id,
          amount: plan.price,
          currency: plan.currency,
          type: 'subscription',
          status: 'completed',
          billingPeriod: {
            start: new Date(startDate),
            end: new Date(endDate)
          },
          planDetails: {
            planId: plan._id,
            planName: plan.name,
            billingCycle: plan.billingCycle,
            originalPrice: plan.price
          },
          paymentDate: new Date(),
          processedDate: new Date()
        };

        console.log("Payment data:", paymentData);
        const payment = await Payment.create(paymentData);
        console.log("✅ Payment recorded successfully:", payment._id, "amount:", payment.amount);
      } catch (paymentError) {
        console.error("❌ Error recording payment:", paymentError);
        console.error("Payment error details:", paymentError.message);
        // Don't fail the whole operation if payment recording fails
      }
    } else {
      console.log("Skipping payment creation - plan is free (price: 0)");
    }

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    console.error("Error details:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error creating subscription",
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Update subscription
 */
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    // Update fields
    if (updates.plan) subscription.plan = updates.plan;
    if (updates.planName) subscription.planName = updates.planName;
    if (updates.startDate) subscription.startDate = new Date(updates.startDate);
    if (updates.endDate) subscription.endDate = new Date(updates.endDate);
    if (updates.status) subscription.status = updates.status;
    if (updates.price !== undefined) subscription.price = updates.price;
    if (updates.currency) subscription.currency = updates.currency;
    if (updates.billingCycle) subscription.billingCycle = updates.billingCycle;
    if (updates.autoRenew !== undefined) subscription.autoRenew = updates.autoRenew;
    if (updates.limits) subscription.limits = { ...subscription.limits, ...updates.limits };

    await subscription.save();

    // Update tenant status based on subscription status
    const tenant = await Tenant.findById(subscription.tenantId);
    if (tenant) {
      if (subscription.status === 'cancelled' && tenant.status === 'active') {
        tenant.status = 'inactive';
        await tenant.save();
        console.log(`Tenant ${tenant._id} status updated to inactive due to subscription cancellation`);

        // Send cancellation notification email to tenant
        try {
          await sendSubscriptionCancelledNotification(
            tenant.contactEmail,
            tenant.contactName || tenant.name,
            {
              planName: subscription.planName,
              cancelledDate: new Date(),
              resubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
              accountUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`
            }
          );
          console.log(`Cancellation notification sent to tenant ${tenant._id}`);
        } catch (emailError) {
          console.error(`Failed to send cancellation notification to tenant ${tenant._id}:`, emailError);
          // Don't fail the operation if email fails
        }
      } else if ((subscription.status === 'expired' || subscription.endDate < new Date()) && tenant.status === 'active') {
        tenant.status = 'expired';
        await tenant.save();
        console.log(`Tenant ${tenant._id} status updated to expired due to subscription expiration`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data: subscription
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      success: false,
      message: "Error updating subscription",
      error: error.message
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to cancel subscription with ID: ${id}`);

    const subscription = await Subscription.findById(id);
    console.log(`Subscription found: ${subscription ? 'Yes' : 'No'}`);

    if (!subscription) {
      console.log(`Subscription ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    console.log(`Current subscription status: ${subscription.status}`);

    if (subscription.status === 'cancelled') {
      console.log(`Subscription ${id} is already cancelled`);
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled"
      });
    }

    subscription.status = 'cancelled';
    await subscription.save();
    console.log(`Subscription ${id} status updated to cancelled`);

    // Process refund for cancelled subscription (if applicable)
    if (subscription.price > 0) {
      try {
        // Find the original payment for this subscription
        const originalPayment = await Payment.findOne({
          subscriptionId: subscription._id,
          type: 'subscription',
          status: 'completed'
        }).sort({ paymentDate: -1 });

        if (originalPayment) {
          // Calculate refund amount (could be prorated based on time used)
          const now = new Date();
          const startDate = subscription.startDate;
          const endDate = subscription.endDate;
          const totalPeriod = endDate - startDate;
          const usedPeriod = Math.min(now - startDate, totalPeriod);
          const refundAmount = Math.round((subscription.price * (totalPeriod - usedPeriod)) / totalPeriod * 100) / 100;

          if (refundAmount > 0) {
            // Record refund payment
            const refundPayment = await Payment.create({
              tenantId: subscription.tenantId,
              subscriptionId: subscription._id,
              amount: refundAmount,
              currency: subscription.currency,
              type: 'refund',
              status: 'completed',
              refundAmount: refundAmount,
              refundReason: 'customer_request',
              billingPeriod: {
                start: subscription.startDate,
                end: subscription.endDate
              },
              planDetails: {
                planName: subscription.planName,
                billingCycle: subscription.billingCycle,
                originalPrice: subscription.price
              },
              paymentDate: new Date(),
              processedDate: new Date(),
              notes: `Refund for cancelled subscription - prorated amount`
            });

            console.log(`Refund payment recorded: ${refundPayment._id}, amount: ${refundAmount} ${subscription.currency}`);
          }
        }
      } catch (refundError) {
        console.error(`Error processing refund for subscription ${id}:`, refundError);
        // Don't fail the operation if refund processing fails
      }
    }

    // Update tenant status to inactive when subscription is cancelled
    const tenant = await Tenant.findById(subscription.tenantId);
    if (tenant) {
      console.log(`Found tenant ${tenant._id} with status: ${tenant.status}`);
      tenant.status = 'inactive';
      await tenant.save();
      console.log(`Tenant ${tenant._id} status updated to inactive due to subscription cancellation`);

      // Send cancellation notification email to tenant
      try {
        await sendSubscriptionCancelledNotification(
          tenant.contactEmail,
          tenant.contactName || tenant.name,
          {
            planName: subscription.planName,
            cancelledDate: new Date(),
            resubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`,
            accountUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`
          }
        );
        console.log(`Cancellation notification sent to tenant ${tenant._id}`);
      } catch (emailError) {
        console.error(`Failed to send cancellation notification to tenant ${tenant._id}:`, emailError);
        // Don't fail the operation if email fails
      }
    } else {
      console.log(`Tenant not found for subscription ${id}, tenantId: ${subscription.tenantId}`);
    }

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    console.error("Error details:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error cancelling subscription",
      error: error.message
    });
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to renew subscription with ID: ${id}`);

    const subscription = await Subscription.findById(id).populate('planId');
    console.log(`Subscription found: ${subscription ? 'Yes' : 'No'}`);

    if (!subscription) {
      console.log(`Subscription ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    // Check if subscription is active or expired (can renew both)
    if (subscription.status === 'cancelled') {
      console.log(`Subscription ${id} is cancelled and cannot be renewed`);
      return res.status(400).json({
        success: false,
        message: "Cannot renew a cancelled subscription. Create a new subscription instead."
      });
    }

    console.log(`Current subscription status: ${subscription.status}`);

    // Calculate new end date based on billing cycle
    const currentEndDate = subscription.endDate > new Date() ? subscription.endDate : new Date();
    let newEndDate = new Date(currentEndDate);

    switch (subscription.billingCycle) {
      case 'monthly':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case 'quarterly':
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case 'yearly':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported billing cycle for renewal"
        });
    }

    // Update subscription
    subscription.endDate = newEndDate;
    subscription.status = 'active';
    await subscription.save();

    console.log(`Subscription ${id} renewed successfully. New end date: ${newEndDate}`);

    // Update tenant status to active
    const tenant = await Tenant.findById(subscription.tenantId);
    if (tenant) {
      tenant.status = 'active';
      await tenant.save();
      console.log(`Tenant ${tenant._id} status updated to active due to subscription renewal`);
    }

    // Record renewal payment
    if (subscription.price > 0 && Payment) {
      console.log(`Recording renewal payment for subscription: ${subscription._id}, amount: ${subscription.price}`);
      try {
        const renewalPayment = await Payment.create({
          tenantId: subscription.tenantId,
          subscriptionId: subscription._id,
          amount: subscription.price,
          currency: subscription.currency,
          type: 'renewal', // Different from initial subscription payment
          status: 'completed',
          billingPeriod: {
            start: currentEndDate,
            end: newEndDate
          },
          planDetails: {
            planId: subscription.planId?._id,
            planName: subscription.planName,
            billingCycle: subscription.billingCycle,
            originalPrice: subscription.price
          },
          paymentDate: new Date(),
          processedDate: new Date(),
          notes: `Renewal payment for subscription`
        });

        console.log(`✅ Renewal payment recorded: ${renewalPayment._id}, amount: ${renewalPayment.amount}`);
      } catch (paymentError) {
        console.error("❌ Error recording renewal payment:", paymentError);
        // Don't fail the operation if payment recording fails
      }
    }

    // Send renewal notification email to tenant
    if (tenant) {
      try {
        await sendSubscriptionRenewedNotification(
          tenant.contactEmail,
          tenant.contactName || tenant.name,
          {
            planName: subscription.planName,
            renewalDate: new Date(),
            newEndDate: newEndDate,
            amount: subscription.price,
            currency: subscription.currency,
            accountUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`
          }
        );
        console.log(`📧 Renewal notification sent to tenant ${tenant._id}`);
      } catch (emailError) {
        console.error(`Failed to send renewal notification to tenant ${tenant._id}:`, emailError);
        // Don't fail the operation if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Subscription renewed successfully",
      data: {
        subscription,
        newEndDate,
        tenantUpdated: !!tenant
      }
    });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    console.error("Error details:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error renewing subscription",
      error: error.message
    });
  }
};

/**
 * Get subscriptions expiring soon (for cron job)
 */
export const getExpiringSubscriptions = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const subscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lte: futureDate, $gte: new Date() }
    })
      .populate('tenantId', 'name contactEmail')
      .sort({ endDate: 1 });

    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error("Error fetching expiring subscriptions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expiring subscriptions",
      error: error.message
    });
  }
};



