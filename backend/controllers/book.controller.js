import Book from "../models/books.model.js";
import Admin from "../models/admin.model.js";

// UPDATE PUBLISHERS FOR EXISTING BOOKS
export const updateBookPublishers = async (req, res) => {
  try {
    // Find all books that have email addresses as publishers (contain @ symbol)
    const booksToUpdate = await Book.find({
      tenantId: req.tenantId,
      publisher: { $regex: '@' } // Books where publisher contains @
    }).populate('uploadedBy', 'name email');

    let updatedCount = 0;

    for (const book of booksToUpdate) {
      if (book.uploadedBy && book.uploadedBy.name) {
        // Update publisher to uploader's name
        await Book.findByIdAndUpdate(book._id, {
          publisher: book.uploadedBy.name
        });
        updatedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} books to use uploader names as publishers`,
      data: { updatedCount }
    });
  } catch (err) {
    console.error("Error updating book publishers:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find({ tenantId: req.tenantId })
      .populate('uploadedBy', 'name email') // Populate uploader info for displaying publisher name
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Books fetched",
      data: books,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ONE
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('uploadedBy', 'name email'); // Populate uploader info
    if (!book)
      return res.status(404).json({ success: false, message: "Not found" });

    res.status(200).json({
      success: true,
      message: "Book fetched",
      data: book,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE
export const createBook = async (req, res) => {
  try {
    console.log("📚 Creating book...");
    console.log("📋 Request body:", req.body);
    console.log("📁 Files received:", req.files);
    console.log("👤 Admin user:", req.admin);
    console.log("🏢 Tenant ID:", req.tenantId);
    console.log("🔑 Headers:", {
      authorization: req.headers.authorization ? "Present" : "Missing",
      'content-type': req.headers['content-type']
    });

    // Validate required fields
    if (!req.body.title || !req.body.author || !req.body.description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, author, description"
      });
    }

    // Check if admin is authenticated
    if (!req.admin || !req.admin._id) {
      console.error("❌ Admin not authenticated:", req.admin);
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    // Handle file uploads
    let coverPath = req.body.cover; // Default to provided URL
    let pdfPath = req.body.pdfUrl; // Default to provided URL

    if (req.files?.cover?.[0]) {
      coverPath = `/uploads/${req.files.cover[0].filename}`;
      console.log("📸 Cover uploaded:", coverPath);
    }

    if (req.files?.pdfFile?.[0]) {
      pdfPath = `/uploads/${req.files.pdfFile[0].filename}`;
      console.log("📄 PDF uploaded:", pdfPath);
    }

    // Validate required files
    if (!coverPath) {
      return res.status(400).json({
        success: false,
        message: "Cover image is required"
      });
    }

    if (!pdfPath) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required"
      });
    }

    const bookData = {
      title: req.body.title,
      author: req.body.author,
      price: parseFloat(req.body.price) || 0,
      description: req.body.description,
      publisher: req.body.publisher || "Unknown Publisher",
      publishedDate: new Date(req.body.publishedDate),
      tenantId: req.tenantId,
      uploadedBy: req.admin._id,
      cover: coverPath,
      pdfUrl: pdfPath
    };

    console.log("📝 Final book data:", bookData);

    const newBook = new Book(bookData);
    await newBook.save();

    console.log("✅ Book created successfully:", newBook._id);

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook,
    });
  } catch (err) {
    console.error("❌ Error creating book:", err);
    console.error("❌ Error details:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// UPDATE
export const updateBook = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      ...(req.files?.cover && { cover: `/uploads/${req.files.cover[0].filename}` }),
      ...(req.files?.pdfFile && { pdfUrl: `/uploads/${req.files.pdfFile[0].filename}` })
    };

    const updated = await Book.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Not found" });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE
export const deleteBook = async (req, res) => {
  try {
    const deleted = await Book.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });

    if (!deleted)
      return res.status(404).json({ success: false, message: "Not found" });

    res.status(200).json({
      success: true,
      message: "Book deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
