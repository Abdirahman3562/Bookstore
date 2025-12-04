import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  updateTestimonialStatus,
  deleteTestimonial
} from "../controllers/testimonials.controller.js";

const router = express.Router();

// Configure multer for testimonial avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'avatar' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for avatar'));
    }
    cb(null, true);
  }
});

// GET /api/testimonials - Get all testimonials
router.get("/", getAllTestimonials);

// GET /api/testimonials/:id - Get single testimonial
router.get("/:id", getTestimonialById);

// POST /api/testimonials - Create new testimonial
router.post("/", upload.single('avatar'), createTestimonial);

// PUT /api/testimonials/:id - Update testimonial
router.put("/:id", upload.single('avatar'), updateTestimonial);

// PATCH /api/testimonials/:id/status - Update testimonial status (approve/reject)
router.patch("/:id/status", updateTestimonialStatus);

// DELETE /api/testimonials/:id - Delete testimonial
router.delete("/:id", deleteTestimonial);

export default router;
