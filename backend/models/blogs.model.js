import mongoose from "mongoose";

// Define reply schema separately
const replySchemaDefinition = {
  id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ""
  },
  reply: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    required: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  replies: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }
};

const commentReplySchema = new mongoose.Schema(replySchemaDefinition, { _id: false });

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ""
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    required: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  replies: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }
}, { _id: false });

const blogSchema = new mongoose.Schema({
  // Multi-tenant support: every blog belongs to a tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
    required: true
  },
  publishedDate: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ""
  },
  content: {
    type: String,
    required: true
  },
  comments: {
    type: [commentSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Indexes for efficient tenant-scoped queries
blogSchema.index({ tenantId: 1, createdAt: -1 });
blogSchema.index({ tenantId: 1, authorId: 1 });
blogSchema.index({ tenantId: 1, status: 1 });

const Blog = mongoose.model("Blog", blogSchema, "blogs");

export default Blog;

