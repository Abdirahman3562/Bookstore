import { connectDB } from './config/db.js';
import ChatMessage from './models/chat.model.js';

async function checkChatMessages() {
  try {
    await connectDB();
    console.log('Checking chat messages with tenantId...');

    const messages = await ChatMessage.find({}).limit(5);
    console.log('Messages with tenantId:', messages.map(m => ({
      userId: m.userId,
      tenantId: m.tenantId,
      sender: m.sender,
      message: m.message?.substring(0, 50)
    })));

    console.log('Checking tenant distribution...');
    const tenantStats = await ChatMessage.aggregate([
      { $group: { _id: '$tenantId', count: { $sum: 1 } } }
    ]);
    console.log('Tenant message counts:', tenantStats);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkChatMessages();







