import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/admin.model.js";
import Tenant from "./models/tenant.model.js";

dotenv.config();

const fixAdminTenant = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    console.log("🔧 Fixing admin tenant associations...");

    // Find the localhost tenant we created
    const localhostTenant = await Tenant.findOne({ domain: 'localhost' });
    if (!localhostTenant) {
      console.log("❌ No localhost tenant found. Please run create-tenant.js first.");
      process.exit(1);
    }

    console.log(`📍 Found localhost tenant: ${localhostTenant.name} (${localhostTenant._id})`);

    // Find all admins that don't have tenantId set
    const adminsWithoutTenant = await Admin.find({ tenantId: { $exists: false } });
    console.log(`👥 Found ${adminsWithoutTenant.length} admins without tenantId`);

    for (const admin of adminsWithoutTenant) {
      console.log(`🔗 Setting tenantId for admin: ${admin.name} (${admin.email}) - ID: ${admin._id}`);

      admin.tenantId = localhostTenant._id;
      await admin.save();

      console.log(`✅ Updated admin ${admin.name}`);
    }

    // Also check the specific admin from the error
    const specificAdmin = await Admin.findById('695421894611a33e91133941');
    if (specificAdmin) {
      console.log(`🎯 Specific admin found: ${specificAdmin.name} (${specificAdmin.email})`);
      console.log(`   Current tenantId: ${specificAdmin.tenantId}`);

      if (!specificAdmin.tenantId) {
        specificAdmin.tenantId = localhostTenant._id;
        await specificAdmin.save();
        console.log(`✅ Set tenantId for specific admin to ${localhostTenant._id}`);
      }
    } else {
      console.log(`❌ Specific admin with ID 695421894611a33e91133941 not found`);
    }

    // Show all admins with their tenant info
    const allAdmins = await Admin.find({});
    console.log(`\n📊 All admins (${allAdmins.length}):`);
    for (const admin of allAdmins) {
      const tenant = admin.tenantId ? await Tenant.findById(admin.tenantId) : null;
      console.log(`   ${admin.name} (${admin.email}) - Role: ${admin.adminRole} - Tenant: ${tenant ? tenant.name : 'NONE'}`);
    }

    console.log("\n✅ Admin tenant associations fixed!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error fixing admin tenants:", error);
    process.exit(1);
  }
};

fixAdminTenant();
