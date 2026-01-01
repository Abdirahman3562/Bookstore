import express from "express";
import fs from "fs";
import path from "path";
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

const router = express.Router();

// Apply tenant middleware to all purchased routes
router.use(resolveTenant);
router.use(requireTenant);
router.use(checkTenantAccess);

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

// GET /api/purchased/:id/download - Download book (secure)
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

      // Try to find the purchase without status restriction to debug
      const anyPurchase = await Purchased.findOne({
        _id: id,
        tenantId: req.tenantId
      });

      if (anyPurchase) {
        console.log("🔍 Purchase exists but doesn't meet criteria:", {
          userId: anyPurchase.userId,
          status: anyPurchase.status,
          isDownloadAllowed: anyPurchase.isDownloadAllowed
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

    // Set appropriate headers
    const filename = path.basename(book.pdfUrl);
    res.setHeader('Content-Disposition', `attachment; filename="${book.title || filename}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error("❌ Error streaming PDF file:", error);
      res.status(500).json({ success: false, message: "Error reading PDF file" });
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
