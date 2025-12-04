import express from "express";
import Book from "../models/books.model.js";

const router = express.Router();

/* GET all books */
router.get("/", async (req, res) => {
  try {
    const books = await Book.find({});
    res.status(200).json({
      success: true,
      message: "Books fetched successfully",
      data: books,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* GET book by id */
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book)
      return res
        .status(404)
        .json({ success: false, message: "Book not found" });

    res.status(200).json({
      success: true,
      message: "Book fetched successfully",
      data: book,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* POST create book */
router.post("/", async (req, res) => {
  try {
    const { title, author, price, pdfUrl, cover, description } = req.body;

    if (!title || !author || !price || !pdfUrl || !cover || !description)
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });

    const newBook = new Book(req.body);
    await newBook.save();

    res.status(201).json({
      success: true,
      message: "Book created",
      data: newBook,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* PUT update book */
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!book)
      return res.status(404).json({ success: false, message: "Book not found" });

    res.status(200).json({
      success: true,
      message: "Book updated",
      data: book,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* DELETE remove book */
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book)
      return res.status(404).json({ success: false, message: "Book not found" });

    res.status(200).json({
      success: true,
      message: "Book deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
