import Blog from "../models/blogs.model.js";

// GET ALL BLOGS
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({}).populate('authorId', 'name username avatar verified bio social').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      data: blogs,
      count: blogs.length
    });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE BLOG
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('authorId', 'name username avatar verified bio social');
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: blog
    });
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE NEW BLOG
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      category,
      authorId,
      publishedDate,
      thumbnail,
      content,
      comments,
      status
    } = req.body;

    const newBlog = new Blog({
      title,
      category,
      authorId,
      publishedDate: publishedDate || new Date().toISOString().split('T')[0],
      thumbnail: thumbnail || "",
      content,
      comments: comments || [],
      status: status || 'draft'
    });

    await newBlog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: newBlog
    });
  } catch (err) {
    console.error("Error creating blog:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: err.message
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE BLOG
export const updateBlog = async (req, res) => {
  try {
    const {
      title,
      category,
      authorId,
      publishedDate,
      thumbnail,
      content,
      comments,
      status
    } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const updateData = {
      title: title || blog.title,
      category: category || blog.category,
      authorId: authorId || blog.authorId,
      publishedDate: publishedDate || blog.publishedDate,
      content: content !== undefined ? content : blog.content,
      comments: comments !== undefined ? comments : blog.comments,
      status: status || blog.status
    };

    // Only update thumbnail if it's provided
    if (thumbnail !== undefined && thumbnail !== null && thumbnail !== "") {
      updateData.thumbnail = thumbnail;
    }

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating blog:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: err.message
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE BLOG STATUS
export const updateBlogStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: published or draft"
      });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Blog status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    console.error("Error updating blog status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE BLOG
export const deleteBlog = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE COMMENT OR REPLY
export const deleteComment = async (req, res) => {
  try {
    const { blogId, commentId, replyId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // Helper function to recursively remove a reply from nested structure
    const removeReply = (replies, targetId) => {
      if (!replies || !Array.isArray(replies)) return [];
      
      return replies.filter(reply => {
        const replyIdStr = String(reply.id || reply._id || '');
        const targetIdStr = String(targetId || '');
        
        if (replyIdStr === targetIdStr) {
          return false; // Remove this reply
        }
        
        // Recursively check nested replies
        if (reply.replies && Array.isArray(reply.replies) && reply.replies.length > 0) {
          reply.replies = removeReply(reply.replies, targetId);
        }
        
        return true;
      });
    };

    if (replyId) {
      // Delete a reply (nested) - search through all comments and their nested replies
      const updatedComments = blog.comments.map(comment => {
        const commentObj = comment.toObject ? comment.toObject() : comment;
        
        // Check if this comment has the reply directly
        if (commentObj.replies && Array.isArray(commentObj.replies)) {
          const hasDirectReply = commentObj.replies.some(reply => {
            const replyIdStr = String(reply.id || reply._id || '');
            const targetIdStr = String(replyId || '');
            return replyIdStr === targetIdStr;
          });
          
          if (hasDirectReply) {
            return {
              ...commentObj,
              replies: removeReply(commentObj.replies, replyId)
            };
          }
          
          // Recursively search in nested replies
          const updatedReplies = commentObj.replies.map(reply => {
            if (reply.replies && Array.isArray(reply.replies) && reply.replies.length > 0) {
              return {
                ...reply,
                replies: removeReply(reply.replies, replyId)
              };
            }
            return reply;
          });
          
          return {
            ...commentObj,
            replies: updatedReplies
          };
        }
        
        return commentObj;
      });

      blog.comments = updatedComments;
    } else {
      // Delete a top-level comment
      blog.comments = blog.comments.filter(comment => {
        const commentIdStr = String(comment.id || comment._id || '');
        const targetIdStr = String(commentId || '');
        return commentIdStr !== targetIdStr;
      });
    }

    await blog.save();

    // Fetch updated blog
    const updatedBlog = await Blog.findById(blogId);

    res.status(200).json({
      success: true,
      message: replyId ? "Reply deleted successfully" : "Comment deleted successfully",
      data: updatedBlog
    });
  } catch (err) {
    console.error("Error deleting comment/reply:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

