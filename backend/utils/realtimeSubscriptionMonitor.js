import Subscription from "../models/subscription.model.js";
import Tenant from "../models/tenant.model.js";
import Admin from "../models/admin.model.js";
import { sendSubscriptionExpiredNotification } from "./emailService.js";

/**
 * Real-time subscription expiry monitor
 * Checks and updates expired subscriptions immediately
 * Designed to run frequently (every minute) to ensure immediate status updates
 */
class RealtimeSubscriptionMonitor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60 * 1000; // Check every 60 seconds (1 minute)
  }

  /**
   * Start the real-time monitoring
   */
  start() {
    if (this.isRunning) {
      console.log("🔄 Real-time subscription monitor is already running");
      return;
    }

    console.log("🚀 Starting real-time subscription monitor...");
    this.isRunning = true;

    // Run initial check
    this.checkExpiredSubscriptions();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkExpiredSubscriptions();
    }, this.checkInterval);

    console.log(`✅ Real-time subscription monitor started (checking every ${this.checkInterval / 1000} seconds)`);
  }

  /**
   * Stop the real-time monitoring
   */
  stop() {
    if (!this.isRunning) {
      console.log("🔄 Real-time subscription monitor is not running");
      return;
    }

    console.log("🛑 Stopping real-time subscription monitor...");
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("✅ Real-time subscription monitor stopped");
  }

  /**
   * Check and update expired subscriptions immediately
   */
  async checkExpiredSubscriptions() {
    try {
      const now = new Date();

      // Find all active subscriptions that have expired
      const expiredSubscriptions = await Subscription.find({
        status: 'active',
        endDate: { $lt: now }
      }).populate('tenantId', 'name contactEmail contactName status');

      if (expiredSubscriptions.length === 0) {
        // Silent - don't log when nothing is expired
        return;
      }

      console.log(`⏰ Found ${expiredSubscriptions.length} expired subscription(s) - updating status immediately`);

      let updatedSubscriptions = 0;
      let updatedTenants = 0;

      // Process each expired subscription
      for (const subscription of expiredSubscriptions) {
        try {
          // Update subscription status
          subscription.status = 'expired';
          await subscription.save();
          updatedSubscriptions++;

          // Update tenant status if it's currently active
          if (subscription.tenantId && subscription.tenantId.status === 'active') {
            subscription.tenantId.status = 'expired';
            await subscription.tenantId.save();
            updatedTenants++;

            console.log(`🔄 Tenant ${subscription.tenantId.name} (${subscription.tenantId._id}) status updated to expired`);

            // Send notifications
            await this.sendExpiryNotifications(subscription, subscription.tenantId);
          }

        } catch (error) {
          console.error(`❌ Error processing expired subscription ${subscription._id}:`, error);
        }
      }

      if (updatedSubscriptions > 0) {
        console.log(`✅ Updated ${updatedSubscriptions} subscription(s) to expired status`);
        console.log(`✅ Updated ${updatedTenants} tenant(s) to expired status`);
      }

    } catch (error) {
      console.error("❌ Error in real-time subscription check:", error);
    }
  }

  /**
   * Send expiry notifications to tenant contact and admins
   */
  /**
   * Send expiry notifications to tenant contact and admins
   */
  async sendExpiryNotifications(subscription, tenant) {
    try {
      // Send notification to tenant contact
      if (tenant.contactEmail) {
        await sendSubscriptionExpiredNotification(
          tenant.contactEmail,
          tenant.contactName || tenant.name,
          {
            planName: subscription.planName,
            endDate: subscription.endDate,
            renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`
          }
        );
        console.log(`📧 Expiry notification sent to tenant contact: ${tenant.contactEmail}`);
      }

      // Send notifications to all tenant admins and revoke their access
      const tenantAdmins = await Admin.find({ tenantId: tenant._id });
      for (const admin of tenantAdmins) {
        try {
          // Send access revoked notification
          await sendAdminAccessRevokedNotification(
            admin.email,
            admin.name,
            tenant.name,
            subscription.endDate
          );

          console.log(`🚫 Access revoked notification sent to admin: ${admin.email}`);
        } catch (emailError) {
          console.error(`Failed to send access revoked notification to ${admin.email}:`, emailError);
        }
      }

      if (tenantAdmins.length > 0) {
        console.log(`📧 Access revoked notifications sent to ${tenantAdmins.length} admin(s)`);
      }

    } catch (error) {
      console.error(`❌ Error sending expiry notifications for tenant ${tenant._id}:`, error);
    }
  }

  /**
   * Manual trigger for immediate check (useful for testing)
   */
  async checkNow() {
    console.log("🔍 Manual subscription expiry check triggered");
    await this.checkExpiredSubscriptions();
    console.log("✅ Manual check completed");
  }

  /**
   * Get current status of the monitor
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      nextCheckIn: this.intervalId ? Math.ceil(this.checkInterval / 1000) : null
    };
  }
}

// Export singleton instance
const realtimeMonitor = new RealtimeSubscriptionMonitor();

export default realtimeMonitor;
