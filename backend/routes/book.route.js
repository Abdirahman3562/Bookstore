import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/book.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant middleware to all book routes
router.use(resolveTenant);
router.use(requireTenant);
router.use(checkTenantAccess);

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
    cb(null, true);
  }
});

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.post("/", upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), createBook);
router.put("/:id", upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), updateBook);
router.delete("/:id", deleteBook);

export default router;
