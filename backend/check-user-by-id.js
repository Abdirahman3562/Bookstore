import mongoose from 'mongoose';
import User from './models/users.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Check if the JWT ID is a user ID
    const userId = '6955262620042c7e6734f822';
    const user = await User.findById(userId);

    if (user) {
      console.log('User found:');
      console.log(`- ID: ${user._id}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- AdminRole: ${user.adminRole}`);
      console.log(`- TenantId: ${user.tenantId}`);
    } else {
      console.log('User NOT found with ID:', userId);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();




