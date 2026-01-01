import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import User from "../models/users.model.js";

/**
 * Authentication middleware for admin routes
 * Sets req.user = { adminId, tenantId, role } for proper multi-tenant support
 * Supports both Admin and User models with admin roles
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

    // Find the admin user in Admin model first
    let admin = await Admin.findById(decoded.id || decoded._id);

    if (admin) {
      // Set req.user with standardized structure
      req.user = {
        adminId: admin._id.toString(),
        tenantId: admin.tenantId ? admin.tenantId.toString() : null,
        role: admin.adminRole,
        email: admin.email,
        permissions: admin.permissions || {}
      };

      // Also set req.admin for backward compatibility
      req.admin = admin.toObject();
      return next();
    }

    // If not found in Admin model, check User model for legacy support
    const user = await User.findById(decoded.id || decoded._id);

    if (user) {
      // If user has admin role, treat as admin
      if (user.adminRole === 'admin' || user.adminRole === 'author') {
        req.user = {
          adminId: user._id.toString(),
          tenantId: user.tenantId ? user.tenantId.toString() : null,
          role: user.adminRole,
          email: user.email,
          permissions: user.permissions || {}
        };

        // Also set req.admin for backward compatibility
        req.admin = user.toObject();
        return next();
      }

      // Regular user - set req.user for their own data access
      req.user = {
        adminId: user._id.toString(),
        tenantId: user.tenantId ? user.tenantId.toString() : null,
        role: 'user',
        email: user.email
      };
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
 * Sets req.user if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");

      // Find the admin user
      let admin = await Admin.findById(decoded.id || decoded._id);

      if (admin) {
        req.user = {
          adminId: admin._id.toString(),
          tenantId: admin.tenantId ? admin.tenantId.toString() : null,
          role: admin.adminRole,
          email: admin.email,
          permissions: admin.permissions || {}
        };
        req.admin = admin.toObject();
      } else {
        // Check User model (legacy support)
        const user = await User.findById(decoded.id || decoded._id);
        if (user) {
          if (user.adminRole === 'admin' || user.adminRole === 'author') {
            // Admin user
            req.user = {
              adminId: user._id.toString(),
              tenantId: user.tenantId ? user.tenantId.toString() : null,
              role: user.adminRole,
              email: user.email,
              permissions: user.permissions || {}
            };
            req.admin = user.toObject();
          } else {
            // Regular user
            req.user = {
              id: user._id.toString(),
              _id: user._id.toString(),
              tenantId: user.tenantId ? user.tenantId.toString() : null,
              role: 'user',
              email: user.email
            };
          }
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
