import mongoose from 'mongoose';
import Admin from './models/admin.model.js';
import Tenant from './models/tenant.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find({}).select('email adminRole tenantId');
    console.log('Admins:');
    admins.forEach(admin => {
      console.log(`- ${admin.email}: role=${admin.adminRole}, tenantId=${admin.tenantId}`);
    });

    // Find all tenants
    const tenants = await Tenant.find({}).select('name subdomain domain status');
    console.log('\nTenants:');
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name}: subdomain=${tenant.subdomain}, domain=${tenant.domain}, status=${tenant.status}, id=${tenant._id}`);
    });

    // Check specific tenant for maan@gmail.com
    const maanTenant = await Tenant.findById('695525d020042c7e6734f6fb');
    console.log('\nMaan tenant details:');
    console.log(JSON.stringify(maanTenant, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();
