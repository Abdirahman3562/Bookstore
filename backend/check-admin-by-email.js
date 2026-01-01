import mongoose from 'mongoose';
import Admin from './models/admin.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Find admin by email
    const admin = await Admin.findOne({ email: 'maan@gmail.com' });

    if (admin) {
      console.log('Admin found:');
      console.log(`- ID: ${admin._id}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Role: ${admin.adminRole}`);
      console.log(`- TenantId: ${admin.tenantId}`);
    } else {
      console.log('Admin NOT found with email: maan@gmail.com');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();

