import Book from "../models/books.model.js";

// GET ALL
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find({ tenantId: req.tenantId });
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
    const book = await Book.findOne({ _id: req.params.id, tenantId: req.tenantId });
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
    const bookData = {
      ...req.body,
      tenantId: req.tenantId, // Add tenantId from middleware
      cover: req.files.cover ? `/uploads/${req.files.cover[0].filename}` : req.body.cover,
      pdfUrl: req.files.pdfFile ? `/uploads/${req.files.pdfFile[0].filename}` : req.body.pdfUrl
    };

    const newBook = new Book(bookData);
    await newBook.save();

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook,
    });
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(500).json({ success: false, message: "Server error" });
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
