import mongoose from 'mongoose';
import Admin from './models/admin.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Check the maanow@gmail.com admin permissions
    const admin = await Admin.findOne({ email: 'maanow@gmail.com' });
    if (!admin) {
      console.log('Admin maanow@gmail.com not found');
      process.exit(1);
    }

    console.log('Admin permissions:');
    console.log(JSON.stringify(admin.permissions, null, 2));

    // Check specific permissions
    console.log('\nSpecific permissions check:');
    console.log('liveChat permission:', admin.permissions.liveChat);
    console.log('websiteSettings permission:', admin.permissions.websiteSettings);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();

