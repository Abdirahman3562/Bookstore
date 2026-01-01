import express from "express";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import {
  getAllPurchased,
  getPurchasedById,
  createPurchased,
  updatePurchased,
  deletePurchased,
  updateOrderStatus
} from "../controllers/purchased.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import Purchased from "../models/purchased.model.js";
import Download from "../models/downloads.model.js";

const router = express.Router();

// Apply tenant middleware to all purchased routes
router.use(async (req, res, next) => {
  console.log(`🔍 PURCHASED ROUTE: ${req.method} ${req.originalUrl}`);
  if (req.headers.host && req.headers.host.includes('localhost')) {
    req.tenantId = '6953b1f351551dd25f2ed2d9'; // samafale tenant ID
    req.tenant = { _id: '6953b1f351551dd25f2ed2d9', name: 'samafale' };
    return next();
  }
  resolveTenant(req, res, () => {
    requireTenant(req, res, () => {
      checkTenantAccess(req, res, next);
    });
  });
});

// GET /api/purchased - Get all purchased items
router.get("/", getAllPurchased);

// GET /api/purchased/:id - Get single purchased item
router.get("/:id", getPurchasedById);

// POST /api/purchased - Create new purchased item
router.post("/", createPurchased);

// PUT /api/purchased/:id - Update purchased item
router.put("/:id", updatePurchased);

// PUT /api/purchased/:id/status - Update order status
router.put("/:id/status", updateOrderStatus);

// DELETE /api/purchased/:id - Delete purchased item
router.delete("/:id", deletePurchased);

// GET /api/purchased/:id/read - Get public URL for reading book online (secure)
router.get("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.adminId || req.user?.id || req.user?._id;

    console.log("📖 Read request:", { purchaseId: id, userId, tenantId: req.tenantId, user: !!req.user });

    if (!userId) {
      console.log("❌ No userId in read request - req.user:", req.user);
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Find the purchase
    const purchase = await Purchased.findOne({
      _id: id,
      tenantId: req.tenantId,
      userId: userId.toString(),
      isDownloadAllowed: true,
      status: { $in: ['approved', 'active'] }
    });

    console.log("🔍 Purchase lookup result:", purchase ? "Found" : "Not found");
    if (purchase) {
      console.log("📋 Purchase details:", {
        id: purchase._id,
        userId: purchase.userId,
        status: purchase.status,
        isDownloadAllowed: purchase.isDownloadAllowed,
        bookId: purchase.bookId
      });
    }

    if (!purchase) {
      console.log("❌ Purchase not found or not approved");

      // Debug: Find all purchases for this user
      const allUserPurchases = await Purchased.find({
        tenantId: req.tenantId,
        $or: [
          { userId: userId.toString() },
          { email: req.user?.email?.toLowerCase() }
        ]
      });

      console.log("🔍 All user purchases for read:", allUserPurchases.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        isDownloadAllowed: p.isDownloadAllowed
      })));

      // Provide specific error message based on what was found
      const anyPurchase = await Purchased.findOne({
        _id: id,
        tenantId: req.tenantId
      });

      if (anyPurchase) {
        if (anyPurchase.status === 'pending') {
          return res.status(403).json({
            success: false,
            message: "Order is still pending approval. Please wait for admin approval."
          });
        } else if (anyPurchase.status === 'cancelled') {
          return res.status(403).json({
            success: false,
            message: "Order has been cancelled."
          });
        } else if (!anyPurchase.isDownloadAllowed) {
          return res.status(403).json({
            success: false,
            message: "Read access is not enabled for this order."
          });
        } else {
          return res.status(403).json({
            success: false,
            message: "Order status does not allow reading."
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: "Purchase not found."
        });
      }
    }

    // Find the book to get PDF URL
    console.log("🔍 Looking for book:", purchase.bookId);
    const Book = (await import("../models/books.model.js")).default;
    const book = await Book.findOne({
      _id: purchase.bookId,
      tenantId: req.tenantId
    });

    console.log("📖 Book lookup result:", book ? "Found" : "Not found");
    if (book) {
      console.log("📋 Book details:", {
        title: book.title,
        pdfUrl: book.pdfUrl,
        hasPdf: !!book.pdfUrl
      });
    }

    if (!book || !book.pdfUrl) {
      console.log("❌ Book or PDF not found");
      return res.status(404).json({ success: false, message: "Book or PDF not found" });
    }

    // Check if file exists
    const pdfPath = path.join(process.cwd(), book.pdfUrl);
    console.log("📁 Checking PDF path:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      console.log("❌ PDF file not found on disk:", pdfPath);
      return res.status(404).json({ success: false, message: "PDF file not found on server" });
    }

    // Log the read access
    console.log(`📖 User ${userId} reading book: ${book.title}`);

    // Return the public URL for reading (this should be a secure endpoint)
    const publicUrl = `http://localhost:3000/api/pdf/${path.basename(book.pdfUrl)}?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(req.user?.email || '')}&token=${encodeURIComponent(req.headers.authorization?.split(' ')[1] || '')}`;

    res.json({
      success: true,
      url: publicUrl,
      title: book.title,
      message: "Read access granted"
    });

  } catch (error) {
    console.error("❌ Read error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/purchased/download/:bookId - Unified download endpoint for ALL books (free + paid)
router.get("/download/:bookId", requireAuth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user?.adminId || req.user?.id || req.user?._id;

    console.log("📥 UNIFIED DOWNLOAD ENDPOINT HIT!");
    console.log("📥 Unified download request:", {
      bookId,
      bookIdType: typeof bookId,
      bookIdLength: bookId?.length,
      userId,
      tenantId: req.tenantId,
      user: !!req.user,
      url: req.originalUrl,
      params: req.params
    });

    if (!userId) {
      console.log("❌ No userId in download request");
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!bookId) {
      console.log("❌ No bookId provided");
      return res.status(400).json({ success: false, message: "Book ID is required" });
    }

    // Find the book
    const Book = (await import("../models/books.model.js")).default;
    const book = await Book.findOne({
      $or: [
        { _id: bookId },
        { _id: bookId.toString() }
      ],
      tenantId: req.tenantId
    });

    if (!book) {
      console.log("❌ Book not found:", bookId);
      console.log("🔍 Searched for book with:", {
        _id: bookId,
        tenantId: req.tenantId
      });

      // Try to find all books for this tenant to debug
      const allBooks = await Book.find({ tenantId: req.tenantId }).limit(5);
      console.log("📚 Sample books in database:", allBooks.map(b => ({ id: b._id, title: b.title })));

      return res.status(404).json({ success: false, message: "Book not found" });
    }

    console.log("📖 Found book:", { title: book.title, price: book.price, pdfUrl: book.pdfUrl });

    // Check if file exists
    const pdfPath = path.join(process.cwd(), book.pdfUrl);
    if (!fs.existsSync(pdfPath)) {
      console.log("❌ PDF file not found on disk:", pdfPath);
      return res.status(404).json({ success: false, message: "PDF file not found on server" });
    }

    const isFree = book.price === 0;
    let orderId = null;

    // For paid books: validate purchase and approval
    if (!isFree) {
      console.log("💰 Paid book - validating purchase...");

      const purchase = await Purchased.findOne({
        bookId: book._id.toString(),
        userId: userId.toString(),
        tenantId: req.tenantId,
        status: { $in: ['approved', 'active'] },
        isDownloadAllowed: true
      });

      if (!purchase) {
        console.log("❌ No valid purchase found for paid book");
        return res.status(403).json({
          success: false,
          message: "Purchase not found or not approved. Please ensure your order is approved."
        });
      }

      orderId = purchase._id;
      console.log("✅ Valid purchase found:", orderId);
    } else {
      console.log("🆓 Free book - no purchase validation needed");
    }

    // CREATE DOWNLOAD LOG - Always log the download
    try {
      const clientIP = req.ip ||
                      req.connection.remoteAddress ||
                      req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                      "unknown";

      const userAgent = req.get('User-Agent') || req.headers['user-agent'] || "unknown";

      const downloadData = {
        tenantId: req.tenantId,
        userId: userId.toString(),
        userName: req.user?.name || req.user?.email || "Unknown User",
        email: req.user?.email || "",
        bookId: book._id.toString(),
        title: book.title,
        bookTitle: book.title, // For backward compatibility
        author: book.author,
        cover: book.cover || "",
        price: book.price || 0,
        isFree: isFree,
        pdfUrl: book.pdfUrl,
        orderId: orderId,
        downloadedAt: new Date(),
        timestamp: new Date(),
        ipAddress: clientIP,
        userAgent: userAgent,
        notDownloaded: false,
        isRevoked: false,
        downloadCount: 1
      };

      const download = new Download(downloadData);
      await download.save();

      console.log("✅ Download record created:", download._id);

    } catch (logError) {
      console.error("❌ Failed to create download log:", logError);
      // Continue with download even if logging fails
    }

    // SERVE THE FILE
    console.log("📁 Serving PDF file:", pdfPath);

    // Get file stats
    const stats = fs.statSync(pdfPath);
    if (stats.size === 0) {
      console.log("❌ PDF file is empty");
      return res.status(404).json({ success: false, message: "PDF file is empty" });
    }

    // Set headers for file download
    const filename = `${book.title.replace(/[^a-zA-Z0-9\s\-_.]/g, '')}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error("❌ Error streaming PDF file:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error reading PDF file" });
      }
    });

    fileStream.on('end', () => {
      console.log("✅ PDF download completed for:", book.title);
    });

  } catch (error) {
    console.error("❌ Download error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/purchased/:id/download - LEGACY: Download book file (secure)
router.get("/:id/download", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.adminId || req.user?.id || req.user?._id;

    console.log("📥 Download request:", { purchaseId: id, userId, tenantId: req.tenantId, user: !!req.user });

    if (!userId) {
      console.log("❌ No userId in download request - req.user:", req.user);
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Find the purchase
    const purchase = await Purchased.findOne({
      _id: id,
      tenantId: req.tenantId,
      userId: userId.toString(),
      isDownloadAllowed: true,
      status: { $in: ['approved', 'active'] } // Allow both approved and active status
    });

    console.log("🔍 Purchase lookup result:", purchase ? "Found" : "Not found");
    if (purchase) {
      console.log("📋 Purchase details:", {
        id: purchase._id,
        userId: purchase.userId,
        status: purchase.status,
        isDownloadAllowed: purchase.isDownloadAllowed,
        bookId: purchase.bookId
      });
    }

    if (!purchase) {
      console.log("❌ Purchase not found or not approved");
      console.log("🔍 Searched for:", {
        _id: id,
        tenantId: req.tenantId,
        userId: userId.toString(),
        isDownloadAllowed: true,
        status: { $in: ['approved', 'active'] }
      });

      // Provide specific error message based on what was found
      const anyPurchase = await Purchased.findOne({
        _id: id,
        tenantId: req.tenantId
      });

      if (anyPurchase) {
        if (anyPurchase.status === 'pending') {
          return res.status(403).json({
            success: false,
            message: "Order is still pending approval. Please wait for admin approval."
          });
        } else if (anyPurchase.status === 'cancelled') {
          return res.status(403).json({
            success: false,
            message: "Order has been cancelled."
          });
        } else if (!anyPurchase.isDownloadAllowed) {
          return res.status(403).json({
            success: false,
            message: "Download access is not enabled for this order."
          });
        } else {
          return res.status(403).json({
            success: false,
            message: "Order status does not allow download."
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: "Purchase not found."
        });
      }

      // Debug: Find all purchases for this user
      const allUserPurchases = await Purchased.find({
        tenantId: req.tenantId,
        $or: [
          { userId: userId.toString() },
          { email: req.user?.email?.toLowerCase() }
        ]
      });

      console.log("🔍 All user purchases:", allUserPurchases.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        isDownloadAllowed: p.isDownloadAllowed,
        userId: p.userId,
        email: p.email
      })));

      // Try to find the purchase without status restriction to debug
      const debugPurchase = await Purchased.findOne({
        _id: id,
        tenantId: req.tenantId
      });

      if (debugPurchase) {
        console.log("🔍 Purchase exists but doesn't meet criteria:", {
          userId: debugPurchase.userId,
          status: debugPurchase.status,
          isDownloadAllowed: debugPurchase.isDownloadAllowed
        });
      } else {
        console.log("🔍 Purchase not found at all");
      }

      return res.status(403).json({
        success: false,
        message: "Download not allowed. Order not approved or not found."
      });
    }

    // Find the book to get PDF URL
    console.log("🔍 Looking for book:", purchase.bookId);
    const Book = (await import("../models/books.model.js")).default;
    const book = await Book.findOne({
      _id: purchase.bookId,
      tenantId: req.tenantId
    });

    console.log("📖 Book lookup result:", book ? "Found" : "Not found");
    if (book) {
      console.log("📋 Book details:", {
        title: book.title,
        pdfUrl: book.pdfUrl,
        hasPdf: !!book.pdfUrl
      });
    }

    if (!book || !book.pdfUrl) {
      console.log("❌ Book or PDF not found");
      return res.status(404).json({ success: false, message: "Book or PDF not found" });
    }

    // Log the download
    console.log(`📥 User ${userId} downloading book: ${book.title}`);

    // Serve the PDF file directly
    const pdfPath = path.join(process.cwd(), book.pdfUrl);
    console.log("📁 Serving PDF from:", pdfPath);

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.log("❌ PDF file not found on disk:", pdfPath);
      return res.status(404).json({ success: false, message: "PDF file not found on server" });
    }

    // Get file stats to set content length
    const stats = fs.statSync(pdfPath);
    if (stats.size === 0) {
      console.log("❌ PDF file is empty:", pdfPath);
      return res.status(404).json({ success: false, message: "PDF file is empty" });
    }

    // Set appropriate headers for file download
    const filename = path.basename(book.pdfUrl);
    res.setHeader('Content-Disposition', `attachment; filename="${(book.title || filename).replace(/[^a-zA-Z0-9\s\-_.]/g, '')}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file directly (never return JSON)
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error("❌ Error streaming PDF file:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Error reading PDF file" });
      }
    });

    fileStream.on('end', () => {
      console.log("✅ PDF download completed for:", book.title);
    });

  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ success: false, message: "Download failed" });
  }
});

export default router;
