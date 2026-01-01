import mongoose from "mongoose";
import Payment from "../models/payment.model.js";
import dotenv from "dotenv";

dotenv.config();

const cleanupTestPayments = async () => {
  try {
    console.log("🧹 Cleaning up test payments...");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');
    console.log("✅ Connected to database");

    // Remove test payments (those without a valid subscription reference)
    const testPayments = await Payment.find({
      subscriptionId: "507f1f77bcf86cd799439011" // The dummy ObjectId I used for tests
    });

    console.log(`Found ${testPayments.length} test payments to remove`);

    for (const payment of testPayments) {
      await Payment.findByIdAndDelete(payment._id);
      console.log(`🗑️ Removed test payment: ${payment._id} ($${payment.amount})`);
    }

    // Check remaining payments
    const remainingPayments = await Payment.find({});
    console.log(`\n📊 Remaining payments: ${remainingPayments.length}`);
    for (const payment of remainingPayments) {
      console.log(`- $${payment.amount} (${payment.type}) - ${payment.status}`);
    }

    console.log("✅ Cleanup completed");

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
};

// Run cleanup directly
cleanupTestPayments()
  .then(() => {
    console.log("✅ Cleanup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  });




