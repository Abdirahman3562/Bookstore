import mongoose from 'mongoose';
import Admin from './models/admin.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Find the maanow@gmail.com admin
    const admin = await Admin.findOne({ email: 'maanow@gmail.com' });
    if (!admin) {
      console.log('Admin maanow@gmail.com not found');
      process.exit(1);
    }

    console.log('Current admin permissions:', admin.permissions);

    // Update permissions to include websiteSettings
    if (!admin.permissions) {
      admin.permissions = {};
    }

    // Add missing permissions
    admin.permissions = {
      ...admin.permissions,
      dashboard: true,
      books: true,
      downloads: true,
      purchased: true,
      testimonials: true,
      users: true,
      authors: true,
      blogs: true,
      contacts: true,
      websiteSettings: true, // Add this
      addAdminUser: admin.permissions.addAdminUser || { view: true, add: true, edit: true, delete: false },
      liveChat: true
    };

    await admin.save();
    console.log('Updated admin permissions:', admin.permissions);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();




