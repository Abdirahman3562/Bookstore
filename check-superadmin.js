import mongoose from 'mongoose';
import Admin from './backend/models/admin.model.js';

async function checkSuperAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    const superAdmins = await Admin.find({ adminRole: 'SUPER_ADMIN' });
    console.log('Super Admins found:', superAdmins.length);
    superAdmins.forEach(admin => {
      console.log('ID:', admin._id, 'Email:', admin.email, 'Name:', admin.name, 'Role:', admin.adminRole);
    });

    // Also check all admins
    const allAdmins = await Admin.find({});
    console.log('\nAll Admins found:', allAdmins.length);
    allAdmins.forEach(admin => {
      console.log('ID:', admin._id, 'Email:', admin.email, 'Name:', admin.name, 'Role:', admin.adminRole);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSuperAdmins();