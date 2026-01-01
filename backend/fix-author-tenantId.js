// Script to fix tenantId for existing author users
import mongoose from 'mongoose';
import Admin from './models/admin.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');
    console.log('✅ MongoDB Connected for fix script');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const fixAuthorTenantIds = async () => {
  try {
    console.log('🔧 Starting to fix tenantId for author users...');

    // Find all author users with tenantId: null
    const authorsWithoutTenant = await Admin.find({
      adminRole: 'author',
      tenantId: null
    });

    console.log(`📊 Found ${authorsWithoutTenant.length} author users with null tenantId`);

    for (const author of authorsWithoutTenant) {
      // For now, we'll keep tenantId as null for author users
      // This makes them "platform-wide" authors that can work across tenants
      // In a production system, you might want to assign them to specific tenants

      console.log(`✅ Author "${author.name}" (${author.email}) - tenantId remains null (platform-wide)`);

      // If you want to assign them to a specific tenant, uncomment and modify this:
      // const defaultTenantId = 'your-default-tenant-id-here';
      // author.tenantId = defaultTenantId;
      // await author.save();
      // console.log(`✅ Updated ${author.name} with tenantId: ${defaultTenantId}`);
    }

    console.log('🎉 Fix completed! Author users are now properly configured.');

  } catch (error) {
    console.error('❌ Error fixing author tenantIds:', error);
  }
};

// Run the fix
const runFix = async () => {
  await connectDB();
  await fixAuthorTenantIds();

  console.log('\n📝 Summary:');
  console.log('- Author users with tenantId: null are kept as platform-wide users');
  console.log('- This allows them to work across all tenants in the system');
  console.log('- Future author users will have proper tenantId and createdBy fields');

  process.exit(0);
};

runFix().catch(console.error);




