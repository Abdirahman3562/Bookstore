import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './backend/models/admin.model.js';

dotenv.config();

async function checkSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');

    const admin = await Admin.findOne({ email: 'superadmin@gmail.com' });
    console.log('SUPER_ADMIN found:', admin ? 'YES' : 'NO');

    if (admin) {
      console.log('Email:', admin.email);
      console.log('Role:', admin.adminRole);
      console.log('Password hash starts with $2a$:', admin.password.startsWith('$2a$'));
      console.log('tenantId:', admin.tenantId);
      console.log('Password hash:', admin.password);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSuperAdmin();



