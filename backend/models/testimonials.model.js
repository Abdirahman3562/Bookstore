import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  // Multi-tenant support: every testimonial belongs to a tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    required: true
  },
  img: {
    type: String,
    required: true
  },
  quote: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes for efficient tenant-scoped queries
testimonialSchema.index({ tenantId: 1, status: 1 });
testimonialSchema.index({ tenantId: 1, createdAt: -1 });

const Testimonial = mongoose.model("Testimonial", testimonialSchema, "testimonials");

export default Testimonial;




