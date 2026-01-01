import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Admin from './models/admin.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Get the maanow@gmail.com admin
    const admin = await Admin.findOne({ email: 'maanow@gmail.com' });
    if (!admin) {
      console.log('Admin maanow@gmail.com not found');
      process.exit(1);
    }

    console.log('Admin found:', {
      email: admin.email,
      adminRole: admin.adminRole,
      permissions: admin.permissions
    });

    // Create JWT token like the login does
    const tokenPayload = {
      id: admin._id,
      email: admin.email,
      adminRole: admin.adminRole,
      permissions: admin.permissions
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "1d" }
    );

    console.log('Generated JWT token for admin');

    // Decode the token back to verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");
    console.log('Decoded JWT payload:', {
      id: decoded.id,
      email: decoded.email,
      adminRole: decoded.adminRole,
      permissions: decoded.permissions
    });

    // Test permission checks
    console.log('\nPermission checks:');
    console.log('liveChat.view:', decoded.permissions.liveChat?.view);
    console.log('websiteSettings.view:', decoded.permissions.websiteSettings?.view);
    console.log('websiteSettings.adminOnly check:', decoded.permissions.websiteSettings?.view === true);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();
