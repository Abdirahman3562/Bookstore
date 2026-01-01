import mongoose from "mongoose";

/**
 * Tenant Model - Represents a customer/organization using the SaaS platform
 * Each tenant is completely isolated from others
 */
const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    default: null // Custom domain (e.g., bookstore.example.com)
  },
  subdomain: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    default: null // Subdomain (e.g., tenant1.bookstore.com)
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'expired', 'inactive'],
    default: 'inactive'
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  contactName: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true,
    default: ""
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// Note: subdomain already has a unique index from the unique: true constraint
tenantSchema.index({ domain: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ createdAt: -1 });

const Tenant = mongoose.model("Tenant", tenantSchema, "tenants");
export default Tenant;




