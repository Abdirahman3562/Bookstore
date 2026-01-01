import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

// Temporary model for reading from downloadlogs collection
const downloadLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  bookId: { type: String, required: true },
  bookTitle: { type: String, required: true },
  author: { type: String, required: true },
  cover: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  isFree: { type: Boolean, required: true, default: false },
  pdfUrl: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, default: null },
  downloadedAt: { type: Date, default: Date.now },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date, default: null },
  revokedBy: { type: String, default: null }
}, { timestamps: true });

const DownloadLog = mongoose.model("DownloadLog", downloadLogSchema, "downloadlogs");
import Download from './models/downloads.model.js';

async function mergeCollections() {
  try {
    console.log('🔄 Starting to merge downloadlogs and downloads collections...');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get all records from downloadlogs collection
    const downloadLogs = await DownloadLog.find({});
    console.log(`📊 Found ${downloadLogs.length} records in downloadlogs collection`);

    // Get all records from downloads collection
    const downloads = await Download.find({});
    console.log(`📊 Found ${downloads.length} records in downloads collection`);

    let migratedCount = 0;
    let skippedCount = 0;

    // Process downloadlogs records
    for (const log of downloadLogs) {
      try {
        // Check if this record already exists in downloads (avoid duplicates)
        const existingDownload = await Download.findOne({
          tenantId: log.tenantId,
          userId: log.userId,
          bookId: log.bookId,
          downloadedAt: log.downloadedAt // Use downloadedAt as unique identifier
        });

        if (existingDownload) {
          console.log(`⏭️ Skipping duplicate record for user ${log.userId}, book ${log.bookId}`);
          skippedCount++;
          continue;
        }

        // Create unified download record
        const unifiedDownload = new Download({
          tenantId: log.tenantId,
          userId: log.userId,
          userName: log.userName,
          email: log.email,
          bookId: log.bookId,
          title: log.bookTitle, // Map bookTitle to title
          author: log.author,
          cover: log.cover,
          price: log.price,
          isFree: log.isFree,
          pdfUrl: log.pdfUrl,
          timestamp: log.downloadedAt, // Map downloadedAt to timestamp
          notDownloaded: log.isRevoked, // Map isRevoked to notDownloaded (inverse logic)
          orderId: log.orderId,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          downloadCount: 1 // Default for migrated records
        });

        await unifiedDownload.save();
        migratedCount++;
        console.log(`✅ Migrated download log for user ${log.userId}, book ${log.bookTitle}`);

      } catch (error) {
        console.error(`❌ Error migrating download log:`, error);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`- Migrated: ${migratedCount} records from downloadlogs`);
    console.log(`- Skipped: ${skippedCount} duplicate records`);
    console.log(`- Total existing downloads: ${downloads.length}`);

    // Optional: Drop the old downloadlogs collection
    console.log('\n🗑️ Dropping old downloadlogs collection...');
    await mongoose.connection.db.dropCollection('downloadlogs');
    console.log('✅ downloadlogs collection dropped');

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
mergeCollections();
