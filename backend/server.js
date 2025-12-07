import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";
import { connectDB } from "./config/db.js";
import bookRoutes from "./routes/book.route.js";
import authRoutes from "./routes/auth.route.js";
import purchasedRoutes from "./routes/purchased.route.js";
import downloadsRoutes from "./routes/downloads.route.js";
import testimonialsRoutes from "./routes/testimonials.route.js";
import usersRoutes from "./routes/users.route.js";
import authorsRoutes from "./routes/authors.route.js";
import blogsRoutes from "./routes/blogs.route.js";
import adminsRoutes from "./routes/admins.route.js";
import pdfRoutes from "./routes/pdf.route.js";
import websiteSettingsRoutes from "./routes/websiteSettings.route.js";
import contactRoutes from "./routes/contact.route.js";
import notificationsRoutes from "./routes/notifications.route.js";

dotenv.config();
const app = express();

// connect DB
connectDB();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for cover'));
    }
    if (file.fieldname === 'pdfFile' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    if (file.fieldname === 'avatar' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for avatar'));
    }
    cb(null, true);
  }
});

// middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (images only - PDFs are protected via /api/pdf route)
// Block direct PDF access through /uploads
app.use('/uploads', (req, res, next) => {
  // Block direct access to PDF files
  if (req.path.endsWith('.pdf')) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: PDF access requires authorization. Please use the application."
    });
  }
  // Allow images and other files
  next();
}, express.static('uploads'));

// Protected PDF route - requires authentication
app.use('/api/pdf', pdfRoutes);
app.use("/api/auth", authRoutes);

// test
app.get("/", (req, res) => {
  res.send("Bookstore API Running");
});

// routes
app.use("/api/books", bookRoutes);
app.use("/api/purchased", purchasedRoutes);
app.use("/api/downloads", downloadsRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/authors", authorsRoutes);
app.use("/api/blogs", blogsRoutes);
app.use("/api/admins", adminsRoutes);
app.use("/api/website-settings", websiteSettingsRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/notifications", notificationsRoutes);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Server running at http://localhost:${PORT}`);
});
