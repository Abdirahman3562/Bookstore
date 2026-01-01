// Check latest author users
import mongoose from 'mongoose';
import Admin from './models/admin.model.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAuthors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');
    console.log('✅ Connected to database');

    const authors = await Admin.find({adminRole: 'author'})
      .sort({createdAt: -1})
      .limit(5);

    console.log(`📊 Found ${authors.length} author users:`);
    console.log('');

    authors.forEach((author, index) => {
      console.log(`${index + 1}. ${author.name} (${author.email})`);
      console.log(`   ID: ${author._id}`);
      console.log(`   tenantId: ${author.tenantId}`);
      console.log(`   createdBy: ${author.createdBy}`);
      console.log(`   createdAt: ${author.createdAt}`);
      console.log('   ---');
    });

    // Check creator details for the latest author
    if (authors.length > 0) {
      const latestAuthor = authors[0];
      if (latestAuthor.createdBy) {
        const creator = await Admin.findById(latestAuthor.createdBy);
        if (creator) {
          console.log('');
          console.log('👤 Creator details for latest author:');
          console.log(`   Creator: ${creator.name} (${creator.email})`);
          console.log(`   Creator Role: ${creator.adminRole}`);
          console.log(`   Creator tenantId: ${creator.tenantId}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

checkAuthors();




