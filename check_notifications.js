import mongoose from 'mongoose';
import Notification from './backend/models/notifications.model.js';
import Admin from './backend/models/admin.model.js';

// Connect to database
mongoose.connect('mongodb://localhost:27017/bookstore').then(async () => {
  console.log('Connected to database');

  // Get all notifications
  const notifications = await Notification.find({}).sort({createdAt: -1}).limit(20);

  console.log(`\n=== Found ${notifications.length} notifications ===\n`);

  notifications.forEach((n, index) => {
    console.log(`${index + 1}. ID: ${n._id}`);
    console.log(`   UserID: ${n.userId}`);
    console.log(`   Title: ${n.title}`);
    console.log(`   Message: ${n.message}`);
    console.log(`   Type: ${n.type}`);
    console.log(`   Created: ${n.createdAt}`);
    console.log(`   Related: ${n.relatedId} (${n.relatedType})`);
    console.log('');
  });

  // Also check admins
  const admins = await Admin.find({}).limit(10);

  console.log(`\n=== Found ${admins.length} admins ===\n`);
  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ID: ${admin._id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.adminRole}`);
    console.log('');
  });

  await mongoose.disconnect();
  console.log('Disconnected from database');
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});