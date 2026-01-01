import { connectDB } from './config/db.js';
import ChatMessage from './models/chat.model.js';
import User from './models/users.model.js';

async function fixChatTenantIds() {
  try {
    await connectDB();
    console.log('🔧 Fixing chat messages tenantId...');

    // Find all chat messages without tenantId
    const messagesWithoutTenantId = await ChatMessage.find({ tenantId: { $exists: false } });
    console.log(`Found ${messagesWithoutTenantId.length} messages without tenantId`);

    let updatedCount = 0;

    for (const message of messagesWithoutTenantId) {
      try {
        // Find the user to get their tenantId
        const user = await User.findById(message.userId);
        if (user && user.tenantId) {
          await ChatMessage.findByIdAndUpdate(message._id, {
            tenantId: user.tenantId
          });
          updatedCount++;
        } else {
          console.log(`⚠️  User ${message.userId} not found or has no tenantId`);
        }
      } catch (error) {
        console.error(`❌ Error updating message ${message._id}:`, error);
      }
    }

    console.log(`✅ Updated ${updatedCount} messages with tenantId`);

    // Verify the fix
    const totalMessages = await ChatMessage.countDocuments();
    const messagesWithTenantId = await ChatMessage.countDocuments({ tenantId: { $exists: true } });

    console.log(`📊 Total messages: ${totalMessages}`);
    console.log(`📊 Messages with tenantId: ${messagesWithTenantId}`);
    console.log(`📊 Messages without tenantId: ${totalMessages - messagesWithTenantId}`);

  } catch (error) {
    console.error('❌ Error fixing chat tenantIds:', error);
  } finally {
    process.exit(0);
  }
}

fixChatTenantIds();







