import mongoose from "mongoose";
import dotenv from "dotenv";
import Notification from "./models/notifications.model.js";
import Tenant from "./models/tenant.model.js";

dotenv.config();

const checkNotificationTenants = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    console.log("🔍 Checking notification tenant associations...");

    // Get all notifications with tenant info
    const notifications = await Notification.find({}).limit(10);
    console.log(`📊 Found ${notifications.length} notifications:`);

    for (const notification of notifications) {
      const tenant = notification.tenantId ? await Tenant.findById(notification.tenantId) : null;
      console.log(`   ${notification.title} - User: ${notification.userId} - Tenant: ${tenant ? tenant.name : 'NONE'} (${notification.tenantId || 'null'})`);
    }

    // Check notifications for the specific user
    const userNotifications = await Notification.find({ userId: '695421894611a33e91133941' });
    console.log(`\n🎯 Notifications for user 695421894611a33e91133941 (${userNotifications.length}):`);

    for (const notification of userNotifications) {
      const tenant = notification.tenantId ? await Tenant.findById(notification.tenantId) : null;
      console.log(`   ${notification.title} - Tenant: ${tenant ? tenant.name : 'NONE'} (${notification.tenantId || 'null'})`);
    }

    // Check all tenants
    const tenants = await Tenant.find({});
    console.log(`\n🏢 All tenants (${tenants.length}):`);
    tenants.forEach(tenant => {
      console.log(`   ${tenant.name} - Domain: ${tenant.domain} - ID: ${tenant._id}`);
    });

    process.exit(0);

  } catch (error) {
    console.error("❌ Error checking notification tenants:", error);
    process.exit(1);
  }
};

checkNotificationTenants();



