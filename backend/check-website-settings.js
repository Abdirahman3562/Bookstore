import mongoose from 'mongoose';
import WebsiteSettings from './models/websiteSettings.model.js';
import Admin from './models/admin.model.js';
import Tenant from './models/tenant.model.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    // Get a sample admin to find their tenant
    const admin = await Admin.findOne({ email: 'maanow@gmail.com' });
    if (!admin) {
      console.log('Admin maanow@gmail.com not found');
      process.exit(1);
    }

    console.log('Admin found:', {
      email: admin.email,
      tenantId: admin.tenantId,
      role: admin.adminRole
    });

    // Check if website settings exist for this tenant
    const settings = await WebsiteSettings.findOne({ tenantId: admin.tenantId });
    if (settings) {
      console.log('Website settings found:', {
        tenantId: settings.tenantId,
        websiteName: settings.websiteName,
        _id: settings._id
      });
    } else {
      console.log('No website settings found for tenant:', admin.tenantId);
      console.log('Creating default website settings...');

      const newSettings = new WebsiteSettings({
        tenantId: admin.tenantId,
        websiteName: 'Bookstore Admin',
        supportEmail: '',
        phoneNumber: '',
        location: ''
      });

      await newSettings.save();
      console.log('Created website settings:', newSettings);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB();
