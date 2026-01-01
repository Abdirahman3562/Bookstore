import mongoose from "mongoose";
import Book from "./models/books.model.js";
import Admin from "./models/admin.model.js";

// Update all books to use uploader's name as publisher instead of email
async function updateBookPublishers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bookstore");

    console.log("🔄 Starting book publisher update...");

    // Find all books that have email addresses as publishers (contain @ symbol)
    const booksToUpdate = await Book.find({
      publisher: { $regex: '@' } // Books where publisher contains @
    });

    console.log('📚 Books with email publishers (before populate):');
    booksToUpdate.forEach(book => {
      console.log(`   - "${book.title}": uploadedBy = ${book.uploadedBy}, publisher = "${book.publisher}"`);
    });

    // Now populate the uploadedBy field
    await Book.populate(booksToUpdate, { path: 'uploadedBy', select: 'name email' });

    console.log(`📚 Found ${booksToUpdate.length} books with email publishers`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const book of booksToUpdate) {
      console.log(`📖 Checking book "${book.title}":`);
      console.log(`   - Current publisher: "${book.publisher}"`);
      console.log(`   - uploadedBy:`, book.uploadedBy);

      if (book.uploadedBy && book.uploadedBy.name) {
        // Update publisher to uploader's name
        await Book.findByIdAndUpdate(book._id, {
          publisher: book.uploadedBy.name
        });
        console.log(`✅ Updated book "${book.title}" publisher to "${book.uploadedBy.name}"`);
        updatedCount++;
      } else if (book.publisher && book.publisher.includes('@')) {
        // Try to find admin by email and update both uploadedBy and publisher
        const admin = await Admin.findOne({ email: book.publisher });
        if (admin) {
          await Book.findByIdAndUpdate(book._id, {
            uploadedBy: admin._id,
            publisher: admin.name || admin.email
          });
          console.log(`✅ Updated book "${book.title}" - set uploadedBy to ${admin.name} and publisher to "${admin.name || admin.email}"`);
          updatedCount++;
        } else {
          console.log(`⚠️  Could not find admin with email "${book.publisher}" for book "${book.title}"`);
          skippedCount++;
        }
      } else {
        console.log(`⚠️  Skipped book "${book.title}" - no uploader info available`);
        skippedCount++;
      }
      console.log('---');
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Updated: ${updatedCount} books`);
    console.log(`⚠️  Skipped: ${skippedCount} books`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating book publishers:", error);
    process.exit(1);
  }
}

updateBookPublishers();
