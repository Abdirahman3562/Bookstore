import mongoose from "mongoose";
import Subscription from "../models/subscription.model.js";
import Payment from "../models/payment.model.js";
import Tenant from "../models/tenant.model.js";
import dotenv from "dotenv";

dotenv.config();

const migrateSubscriptionPayments = async () => {
  try {
    console.log("🔄 Starting subscription payment migration...");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');
    console.log("✅ Connected to database");

    // Find all subscriptions with prices > 0
    const paidSubscriptions = await Subscription.find({
      price: { $gt: 0 },
      status: { $in: ['active', 'cancelled', 'expired'] }
    }).populate('planId', 'name currency billingCycle');

    console.log(`📋 Found ${paidSubscriptions.length} paid subscriptions to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const subscription of paidSubscriptions) {
      try {
        // Check if payment already exists for this subscription
        const existingPayment = await Payment.findOne({
          subscriptionId: subscription._id,
          type: 'subscription'
        });

        if (existingPayment) {
          console.log(`⏭️ Payment already exists for subscription ${subscription._id}`);
          skippedCount++;
          continue;
        }

        // Get tenant info
        const tenant = await Tenant.findById(subscription.tenantId);
        if (!tenant) {
          console.log(`⚠️ Tenant not found for subscription ${subscription._id}`);
          continue;
        }

        // Determine payment status based on subscription status
        let paymentStatus = 'completed';
        if (subscription.status === 'cancelled') {
          // For cancelled subscriptions, mark as refunded if cancelled recently
          const daysSinceCancel = (new Date() - subscription.updatedAt) / (1000 * 60 * 60 * 24);
          if (daysSinceCancel < 30) { // Within last 30 days
            paymentStatus = 'refunded';
          }
        }

        // Create payment record
        const paymentData = {
          tenantId: subscription.tenantId,
          subscriptionId: subscription._id,
          amount: subscription.price,
          currency: subscription.currency || 'USD',
          type: 'subscription',
          status: paymentStatus,
          billingPeriod: {
            start: subscription.startDate,
            end: subscription.endDate
          },
          planDetails: {
            planId: subscription.planId?._id,
            planName: subscription.planName || subscription.planId?.name || 'Unknown Plan',
            billingCycle: subscription.billingCycle || subscription.planId?.billingCycle || 'monthly',
            originalPrice: subscription.price
          },
          paymentDate: subscription.createdAt,
          processedDate: subscription.createdAt
        };

        // If refunded, add refund information
        if (paymentStatus === 'refunded') {
          // Calculate prorated refund (simple version - could be more sophisticated)
          const now = new Date();
          const startDate = subscription.startDate;
          const endDate = subscription.endDate;
          const totalPeriod = endDate - startDate;
          const usedPeriod = Math.min(now - startDate, totalPeriod);
          const refundAmount = Math.round((subscription.price * (totalPeriod - usedPeriod)) / totalPeriod * 100) / 100;

          paymentData.refundAmount = refundAmount;
          paymentData.refundReason = 'subscription_cancelled';
        }

        const payment = await Payment.create(paymentData);
        console.log(`✅ Created payment record for subscription ${subscription._id}: ${payment._id}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating subscription ${subscription._id}:`, error);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Migrated: ${migratedCount} payments`);
    console.log(`⏭️ Skipped: ${skippedCount} existing payments`);
    console.log(`📈 Total processed: ${migratedCount + skippedCount}`);

    // Calculate and display revenue summary
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          refunds: { $sum: '$refundAmount' }
        }
      }
    ]);

    if (totalRevenue.length > 0) {
      const { total, refunds } = totalRevenue[0];
      const netRevenue = total - refunds;
      console.log(`\n💰 Revenue Summary:`);
      console.log(`💵 Gross Revenue: $${total.toFixed(2)}`);
      console.log(`💸 Refunds: $${refunds.toFixed(2)}`);
      console.log(`💰 Net Revenue: $${netRevenue.toFixed(2)}`);
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSubscriptionPayments()
    .then(() => {
      console.log("✅ Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export default migrateSubscriptionPayments;

