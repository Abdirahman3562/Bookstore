import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import User from "../models/users.model.js";

/**
 * Authentication middleware for admin routes
 * Sets req.admin with the authenticated admin user
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");

    // Find the admin user
    let admin = await Admin.findById(decoded.id || decoded._id);

    if (admin) {
      // Convert to plain object to avoid issues
      req.admin = admin.toObject();
      return next();
    }

    // If not found in Admin model, check User model (legacy support)
    const user = await User.findById(decoded.id || decoded._id);
    if (user && (user.adminRole === 'admin' || user.adminRole === 'author')) {
      req.admin = user.toObject();
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token or user not found"
    });

  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.admin if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");

      // Find the admin user
      let admin = await Admin.findById(decoded.id || decoded._id);

      if (admin) {
        req.admin = admin.toObject();
      } else {
        // Check User model (legacy support)
        const user = await User.findById(decoded.id || decoded._id);
        if (user && (user.adminRole === 'admin' || user.adminRole === 'author')) {
          req.admin = user.toObject();
        }
      }
    }

    // Always continue, even if no authentication
    next();

  } catch (error) {
    // Silently fail and continue without authentication
    next();
  }
};
