import { connectDB } from './config/db.js';
import ChatMessage from './models/chat.model.js';

async function checkConversations() {
  try {
    await connectDB();
    console.log('🔍 Checking current chat conversations...\n');

    // Get all conversations (like the API does for SUPER_ADMIN)
    const conversations = await ChatMessage.aggregate([
      {
        $group: {
          _id: '$userId',
          lastMessage: { $max: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          },
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' },
          userAvatar: { $first: '$userAvatar' },
          messageCount: { $sum: 1 },
          tenantId: { $first: '$tenantId' }
        }
      },
      { $sort: { lastMessage: -1 } },
      { $limit: 10 }
    ]);

    console.log(`📊 Found ${conversations.length} conversations:\n`);

    conversations.forEach((conv, index) => {
      console.log(`${index + 1}. 👤 User: ${conv.userName || 'Unknown User'}`);
      console.log(`   📧 Email: ${conv.userEmail || 'No email'}`);
      console.log(`   🆔 User ID: ${conv._id}`);
      console.log(`   🏢 Tenant ID: ${conv.tenantId || 'No tenant'}`);
      console.log(`   💬 Messages: ${conv.messageCount}`);
      console.log(`   📨 Unread: ${conv.unreadCount}`);
      console.log(`   🕒 Last message: ${new Date(conv.lastMessage).toLocaleString()}`);
      console.log('   ──────────────────────────────────');
    });

    // Also check total message count
    const totalMessages = await ChatMessage.countDocuments();
    console.log(`\n📈 Total messages in database: ${totalMessages}`);

  } catch (error) {
    console.error('❌ Error checking conversations:', error);
  } finally {
    process.exit(0);
  }
}

checkConversations();

