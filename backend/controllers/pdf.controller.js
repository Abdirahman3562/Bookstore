import fs from 'fs';
import path from 'path';
import Book from '../models/books.model.js';
import Purchased from '../models/purchased.model.js';
import Download from '../models/downloads.model.js';

// Protected PDF access - verify user has permission before serving
export const getProtectedPDF = async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.query.userId || req.headers['user-id'];
    const userEmail = req.query.email || req.headers['user-email'];

    // If no user info provided, deny access
    if (!userId && !userEmail) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User information required"
      });
    }

    // Find the book by PDF filename
    const pdfPath = `/uploads/${filename}`;
    const book = await Book.findOne({ pdfUrl: pdfPath });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Check if book is free
    const isFreeBook = book.price === 0;

    // Check if user has purchased this book (active status)
    const hasPurchase = await Purchased.findOne({
      $or: [
        { userId: userId?.toString() },
        { email: userEmail?.toLowerCase() }
      ],
      bookId: book._id.toString(),
      status: 'active'
    });

    // Check if download access has been revoked for this user and book
    const revokedAccess = await Download.findOne({
      $or: [
        { userId: userId?.toString() },
        { email: userEmail?.toLowerCase() }
      ],
      bookId: book._id.toString(),
      notDownloaded: true
    });

    // If access is revoked, deny access regardless of purchase status
    if (revokedAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Your download access to this book has been revoked"
      });
    }

    // Check if user has free download access (not revoked)
    const hasDownloadAccess = await Download.findOne({
      $or: [
        { userId: userId?.toString() },
        { email: userEmail?.toLowerCase() }
      ],
      bookId: book._id.toString(),
      notDownloaded: { $ne: true }
    });

    // Grant access if:
    // 1. User has an active purchase (for paid books)
    // 2. OR book is free AND user has download access (not revoked)
    const hasAccess = hasPurchase || (isFreeBook && hasDownloadAccess);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You don't have permission to access this book"
      });
    }

    // Construct full file path
    const filePath = path.join(process.cwd(), 'uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found"
      });
    }

    // Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${book.title}.pdf"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error("Error serving protected PDF:", error);
    res.status(500).json({
      success: false,
      message: "Server error while accessing PDF"
    });
  }
};

