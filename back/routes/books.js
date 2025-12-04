const express = require('express');
const Book = require('../models/Book');

const router = express.Router();

// GET /api/books - Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/books/:id - Get single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/books - Create new book (admin only)
router.post('/', async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'ISBN already exists' });
    } else {
      res.status(400).json({ error: 'Invalid book data' });
    }
  }
});

// PUT /api/books/:id - Update book (admin only)
router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(400).json({ error: 'Invalid book data' });
  }
});

// DELETE /api/books/:id - Delete book (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/books/search/:query - Search books
router.get('/search/:query', async (req, res) => {
  try {
    const books = await Book.find({
      $text: { $search: req.params.query },
      isActive: true
    }).select('-__v');

    res.json(books);
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
