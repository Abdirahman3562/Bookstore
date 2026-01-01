import mongoose from "mongoose";

const purchasedSchema = new mongoose.Schema({
  // Multi-tenant support: every purchase belongs to a tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ""
  },
  bookId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  cover: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  paymentmethod: {
    type: String,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  pdfUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'cancelled', 'active'],
    default: 'pending'
  },
  isDownloadAllowed: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient tenant-scoped queries
purchasedSchema.index({ tenantId: 1, userId: 1 });
purchasedSchema.index({ tenantId: 1, status: 1 });
purchasedSchema.index({ tenantId: 1, createdAt: -1 });

const Purchased = mongoose.model("Purchased", purchasedSchema, "purchased");

export default Purchased;
