import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  billingCycle: {
    type: String,
    required: true,
    enum: ['free', 'monthly', 'yearly', 'lifetime'],
    default: 'monthly'
  },
  limits: {
    users: {
      type: Number,
      default: -1, // -1 means unlimited
      min: -1
    },
    books: {
      type: Number,
      default: -1, // -1 means unlimited
      min: -1
    },
    storage: {
      type: Number,
      default: -1, // -1 means unlimited, otherwise in bytes
      min: -1
    },
    bandwidth: {
      type: Number,
      default: -1, // -1 means unlimited, otherwise in bytes
      min: -1
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


// Index for faster queries
planSchema.index({ key: 1 });
planSchema.index({ isActive: 1 });

export default mongoose.model('Plan', planSchema);
