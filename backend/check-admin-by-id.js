import mongoose from 'mongoose';
import Admin from './models/admin.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Check the admin from JWT token
    const adminId = '6955262620042c7e6734f822';
    const admin = await Admin.findById(adminId);

    if (admin) {
      console.log('Admin found:');
      console.log(`- ID: ${admin._id}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Role: ${admin.adminRole}`);
      console.log(`- TenantId: ${admin.tenantId}`);
    } else {
      console.log('Admin NOT found with ID:', adminId);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();




