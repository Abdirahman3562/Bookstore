import mongoose from "mongoose";
import Plan from "../models/plans.model.js";
import Subscription from "../models/subscription.model.js";
import Tenant from "../models/tenant.model.js";
import Payment from "../models/payment.model.js";
import dotenv from "dotenv";

dotenv.config();

const testRevenue = async () => {
  try {
    console.log("🔄 Testing revenue system...");

    // Connect to database
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    console.log("Connecting to database:", mongoURI);
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to database");

    // Check existing plans
    console.log("\n📋 Checking existing plans:");
    const plans = await Plan.find({});
    console.log(`Found ${plans.length} plans:`);
    for (const plan of plans) {
      console.log(`- ${plan.name}: $${plan.price} (${plan.billingCycle}) - Key: ${plan.key}`);
    }

    // Check existing subscriptions
    console.log("\n📋 Checking existing subscriptions:");
    const subscriptions = await Subscription.find({}).populate('planId', 'name price');
    console.log(`Found ${subscriptions.length} subscriptions:`);
    for (const sub of subscriptions) {
      console.log(`- ${sub.planName}: $${sub.price} (${sub.status}) - Plan: ${sub.planId?.name || 'N/A'} - ID: ${sub._id}`);

      // Create payment for existing paid subscriptions that don't have payments
      if (sub.price > 0 && sub.status !== 'cancelled') {
        const existingPayment = await Payment.findOne({ subscriptionId: sub._id });
        if (!existingPayment) {
          console.log(`Creating payment for subscription ${sub._id}...`);
          try {
            const payment = await Payment.create({
              tenantId: sub.tenantId,
              subscriptionId: sub._id,
              amount: sub.price,
              currency: sub.currency || 'USD',
              type: 'subscription',
              status: sub.status === 'active' ? 'completed' : 'completed', // Keep as completed for historical data
              billingPeriod: {
                start: sub.startDate,
                end: sub.endDate
              },
              planDetails: {
                planId: sub.planId?._id,
                planName: sub.planName,
                billingCycle: sub.billingCycle,
                originalPrice: sub.price
              },
              paymentDate: sub.createdAt,
              processedDate: sub.createdAt
            });
            console.log(`✅ Created payment: ${payment._id}`);
          } catch (error) {
            console.error(`❌ Failed to create payment for ${sub._id}:`, error);
          }
        }
      }
    }

    // Note: Test payments are created separately via cleanupTestPayments.js for testing

    // Check existing payments
    console.log("\n💰 Checking existing payments:");
    const payments = await Payment.find({});
    console.log(`Found ${payments.length} payments:`);
    for (const payment of payments) {
      console.log(`- $${payment.amount} (${payment.type}) - ${payment.status} - ID: ${payment._id}`);
    }

    // Test revenue calculation (same as dashboard)
    console.log("\n📊 Testing revenue calculation (same as dashboard):");
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyPayments = await Payment.find({
      status: 'completed',
      type: 'subscription', // Only subscription payments (same as dashboard)
      paymentDate: {
        $gte: currentMonth,
        $lt: nextMonth
      }
    });

    let monthlyRevenue = 0;
    let refundsThisMonth = 0;

    for (const payment of monthlyPayments) {
      if (payment.type === 'refund') {
        monthlyRevenue -= payment.amount;
        refundsThisMonth += payment.amount;
      } else {
        monthlyRevenue += payment.amount;
      }
    }

    console.log(`Monthly Revenue: $${monthlyRevenue}`);
    console.log(`Refunds this month: $${refundsThisMonth}`);
    console.log(`Net Revenue: $${monthlyRevenue}`);

    // Count paid subscriptions
    const paidSubscriptions = await Subscription.countDocuments({
      status: 'active',
      price: { $gt: 0 }
    });
    console.log(`Active paid subscriptions: ${paidSubscriptions}`);

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
};

// Run test directly
testRevenue()
  .then(() => {
    console.log("✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

export default testRevenue;
