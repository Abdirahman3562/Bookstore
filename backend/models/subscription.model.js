import mongoose from "mongoose";

/**
 * Subscription Model - Manages tenant subscriptions and billing
 * Each tenant must have an active subscription to access the platform
 */
const subscriptionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'monthly', 'yearly', 'lifetime', 'custom'],
    default: 'monthly'
  },
  planName: {
    type: String,
    trim: true,
    default: "Monthly Plan"
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },
  // Pricing information
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['free', 'monthly', 'quarterly', 'yearly', 'lifetime'],
    default: 'monthly'
  },
  // Features/limits for this subscription
  limits: {
    users: { type: Number, default: -1 }, // -1 means unlimited
    books: { type: Number, default: -1 },
    storage: { type: Number, default: 1073741824 }, // 1GB in bytes
    bandwidth: { type: Number, default: -1 } // -1 means unlimited
  },
  // Auto-renewal settings
  autoRenew: {
    type: Boolean,
    default: true
  },
  // Payment information (optional - can be stored separately for security)
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'paypal', 'other'],
    default: null
  },
  // Notes and metadata
  notes: {
    type: String,
    default: ""
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
subscriptionSchema.index({ tenantId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Virtual to check if subscription is expired
subscriptionSchema.virtual('isExpired').get(function() {
  return this.endDate < new Date() || this.status === 'expired';
});

// Virtual to check if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.endDate >= new Date();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema, "subscriptions");
export default Subscription;



