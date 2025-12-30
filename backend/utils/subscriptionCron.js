import Subscription from "../models/subscription.model.js";
import Tenant from "../models/tenant.model.js";
import Admin from "../models/admin.model.js";
import { sendSubscriptionExpiryNotification, sendSubscriptionExpiredNotification, sendAdminAccessRevokedNotification } from "./emailService.js";

/**
 * Check and expire subscriptions that have passed their end date
 * This should be run as a cron job (daily recommended)
 */
export const expireSubscriptions = async () => {
  try {
    console.log("🔄 Running subscription expiration check...");

    const now = new Date();

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lt: now }
    });

    if (expiredSubscriptions.length === 0) {
      console.log("✅ No expired subscriptions found");
      return { expired: 0, tenantsUpdated: 0 };
    }

    console.log(`📋 Found ${expiredSubscriptions.length} expired subscription(s)`);

    // Update subscription statuses
    const subscriptionIds = expiredSubscriptions.map(sub => sub._id);
    await Subscription.updateMany(
      { _id: { $in: subscriptionIds } },
      { status: 'expired' }
    );

    // Update tenant statuses
    const tenantIds = expiredSubscriptions.map(sub => sub.tenantId);
    const tenantUpdateResult = await Tenant.updateMany(
      { _id: { $in: tenantIds }, status: 'active' },
      { status: 'expired' }
    );

    // Send notifications to tenant contacts and revoke admin access
    for (const subscription of expiredSubscriptions) {
      try {
        const tenant = await Tenant.findById(subscription.tenantId);
        if (tenant) {
          // Send expired notification to tenant contact
          await sendSubscriptionExpiredNotification(
            tenant.contactEmail,
            tenant.contactName || tenant.name,
            {
              planName: subscription.planName,
              endDate: subscription.endDate,
              renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`
            }
          );

          // Revoke access for all tenant admins
          const tenantAdmins = await Admin.find({ tenantId: subscription.tenantId });
          for (const admin of tenantAdmins) {
            // Send access revoked notification
            await sendAdminAccessRevokedNotification(
              admin.email,
              admin.name,
              tenant.name,
              subscription.endDate
            );

            // Note: In a real implementation, you might want to set admin status to 'suspended'
            // or implement a login blocker based on tenant subscription status
          }
        }
      } catch (notificationError) {
        console.error(`Failed to send notification for subscription ${subscription._id}:`, notificationError);
      }
    }

    console.log(`✅ Expired ${expiredSubscriptions.length} subscription(s)`);
    console.log(`✅ Updated ${tenantUpdateResult.modifiedCount} tenant(s) to expired status`);

    return {
      expired: expiredSubscriptions.length,
      tenantsUpdated: tenantUpdateResult.modifiedCount
    };
  } catch (error) {
    console.error("❌ Error expiring subscriptions:", error);
    throw error;
  }
};

/**
 * Check subscriptions expiring soon and send notifications
 * @param {number} days - Number of days ahead to check (default: 7)
 */
export const checkExpiringSubscriptions = async (days = 7) => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lte: futureDate, $gte: new Date() }
    })
      .populate('tenantId', 'name contactEmail contactName')
      .sort({ endDate: 1 });

    // Send expiry notifications
    for (const subscription of expiringSubscriptions) {
      try {
        const tenant = subscription.tenantId;
        if (tenant) {
          const daysLeft = Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));

          await sendSubscriptionExpiryNotification(
            tenant.contactEmail,
            tenant.contactName || tenant.name,
            {
              planName: subscription.planName,
              endDate: subscription.endDate,
              daysLeft: daysLeft
            }
          );
        }
      } catch (notificationError) {
        console.error(`Failed to send expiry notification for subscription ${subscription._id}:`, notificationError);
      }
    }

    return expiringSubscriptions;
  } catch (error) {
    console.error("❌ Error checking expiring subscriptions:", error);
    throw error;
  }
};

// If running directly (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  expireSubscriptions()
    .then(result => {
      console.log("Cron job completed:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Cron job failed:", error);
      process.exit(1);
    });
}

