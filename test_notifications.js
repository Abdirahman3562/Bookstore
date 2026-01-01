// Simple test to check notifications API
const mongoose = require('mongoose');
const Notification = require('./backend/models/notifications.model.js');
const Admin = require('./backend/models/admin.model.js');

async function testNotifications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bookstore');

    // Check admins
    const admins = await Admin.find({});
    console.log('Found', admins.length, 'admins:');
    admins.forEach(a => {
      console.log('- ID:', a._id.toString(), 'Name:', a.name, 'Email:', a.email, 'TenantId:', a.tenantId);
    });

    // Check notifications
    const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('Found', notifications.length, 'notifications:');
    notifications.forEach(n => {
      console.log('- ID:', n._id, 'UserId:', n.userId, 'Type:', n.type, 'Title:', n.title, 'TenantId:', n.tenantId, 'Created:', n.createdAt);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testNotifications();




