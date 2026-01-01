import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  // Multi-tenant support
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },

  // Subscription reference
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
    index: true
  },

  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] // Add more currencies as needed
  },

  // Payment type
  type: {
    type: String,
    required: true,
    enum: ['subscription', 'renewal', 'upgrade', 'refund', 'proration'],
    default: 'subscription'
  },

  // Payment method
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash', 'credit_card', 'other'],
    default: 'other'
  },

  // Payment status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'completed'
  },

  // External payment reference (Stripe payment ID, etc.)
  externalId: {
    type: String,
    index: true
  },

  // Billing period this payment covers
  billingPeriod: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },

  // Plan details at time of payment
  planDetails: {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan"
    },
    planName: String,
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'free']
    },
    originalPrice: Number
  },

  // Refund information (if applicable)
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  refundReason: {
    type: String,
    enum: ['customer_request', 'service_issue', 'duplicate', 'fraud', 'other']
  },

  // Transaction metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },

  // Payment date
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Processed date (when status changed to completed)
  processedDate: {
    type: Date
  },

  // Notes
  notes: String

}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ tenantId: 1, paymentDate: -1 });
paymentSchema.index({ subscriptionId: 1, paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });
paymentSchema.index({ tenantId: 1, status: 1, paymentDate: -1 });
paymentSchema.index({ type: 1, paymentDate: -1 });

// Virtual for net amount (amount - refundAmount)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.refundAmount;
});

// Instance method to process refund
paymentSchema.methods.processRefund = async function(refundAmount, reason = 'customer_request') {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed payments');
  }

  if (refundAmount > this.amount - this.refundAmount) {
    throw new Error('Refund amount exceeds available amount');
  }

  this.refundAmount += refundAmount;
  this.refundReason = reason;

  if (this.refundAmount >= this.amount) {
    this.status = 'refunded';
  }

  return this.save();
};

const Payment = mongoose.model("Payment", paymentSchema, "payments");

export default Payment;







