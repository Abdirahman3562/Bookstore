import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    // Multi-tenant support: every book belongs to a tenant
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0 },
    pdfUrl: { type: String, required: true },
    cover: { type: String, required: true },
    description: { type: String, required: true },
    publisher: { type: String, default: "Unknown Publisher" },
    publishedDate: { type: Date, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
  },
  { timestamps: true }
);

// Indexes for efficient tenant-scoped queries
bookSchema.index({ tenantId: 1, createdAt: -1 });
bookSchema.index({ tenantId: 1, title: 1 });

const Book = mongoose.model("Book", bookSchema);
export default Book;
