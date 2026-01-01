import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.model.js";
import Tenant from "./models/tenant.model.js";

dotenv.config();

const fixUserTenant = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    console.log("🔧 Fixing user tenant associations...");

    // Find the localhost tenant we created
    const localhostTenant = await Tenant.findOne({ domain: 'localhost' });
    if (!localhostTenant) {
      console.log("❌ No localhost tenant found. Please run create-tenant.js first.");
      process.exit(1);
    }

    console.log(`📍 Found localhost tenant: ${localhostTenant.name} (${localhostTenant._id})`);

    // Check the specific user from the error
    const specificUser = await User.findById('695421894611a33e91133941');
    if (specificUser) {
      console.log(`🎯 Specific user found: ${specificUser.name} (${specificUser.email})`);
      console.log(`   Current tenantId: ${specificUser.tenantId}`);

      if (!specificUser.tenantId) {
        specificUser.tenantId = localhostTenant._id;
        await specificUser.save();
        console.log(`✅ Set tenantId for specific user to ${localhostTenant._id}`);
      }
    } else {
      console.log(`❌ Specific user with ID 695421894611a33e91133941 not found`);
    }

    // Find all users that don't have tenantId set
    const usersWithoutTenant = await User.find({ tenantId: { $exists: false } });
    console.log(`👥 Found ${usersWithoutTenant.length} users without tenantId`);

    for (const user of usersWithoutTenant) {
      console.log(`🔗 Setting tenantId for user: ${user.name} (${user.email}) - ID: ${user._id}`);

      user.tenantId = localhostTenant._id;
      await user.save();

      console.log(`✅ Updated user ${user.name}`);
    }

    // Show all users with their tenant info
    const allUsers = await User.find({});
    console.log(`\n📊 All users (${allUsers.length}):`);
    for (const user of allUsers) {
      const tenant = user.tenantId ? await Tenant.findById(user.tenantId) : null;
      console.log(`   ${user.name} (${user.email}) - Tenant: ${tenant ? tenant.name : 'NONE'}`);
    }

    console.log("\n✅ User tenant associations fixed!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error fixing user tenants:", error);
    process.exit(1);
  }
};

fixUserTenant();



