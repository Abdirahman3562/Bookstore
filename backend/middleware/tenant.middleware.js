import jwt from "jsonwebtoken";
import Tenant from "../models/tenant.model.js";
import Subscription from "../models/subscription.model.js";
import Admin from "../models/admin.model.js";
import { sendSubscriptionExpiredNotification } from "../utils/emailService.js";

/**
 * Middleware to resolve tenant from request
 * Supports multiple methods:
 * 1. X-Tenant-Id header
 * 2. Subdomain from hostname
 * 3. Domain from hostname
 * 4. Tenant ID from JWT token (for authenticated requests)
 */
export const resolveTenant = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenant = null;

    // Method 1: Check X-Tenant-Id header (for API calls)
    if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    }
    // Method 2: Extract from subdomain/domain
    else if (req.headers.host) {
      const host = req.headers.host.toLowerCase();
      // Extract subdomain (e.g., tenant1.example.com -> tenant1)
      const parts = host.split('.');
      if (parts.length >= 3) {
        const subdomain = parts[0];
        tenant = await Tenant.findOne({ subdomain });
        if (tenant) {
          tenantId = tenant._id.toString();
        }
      }
      // Or check by domain
      if (!tenant) {
        tenant = await Tenant.findOne({ domain: host });
        if (tenant) {
          tenantId = tenant._id.toString();
        }
      }
      // For localhost development, use the first tenant as default
      if (!tenant && (host.includes('localhost') || host.includes('127.0.0.1'))) {
        tenant = await Tenant.findOne({}); // Get first tenant for development
        if (tenant) {
          tenantId = tenant._id.toString();
          console.log(`🏠 Localhost detected - using default tenant: ${tenant.name}`);
        }
      }
    }
    // Method 3: Extract from JWT token (if authenticated)
    else if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");
        
        // If admin has tenantId in token, use it
        if (decoded.tenantId) {
          tenantId = decoded.tenantId;
        }
        // If user has tenantId in token, use it
        else if (decoded.id) {
          // Check if it's an admin or user
          const admin = await Admin.findById(decoded.id);
          if (admin && admin.tenantId) {
            tenantId = admin.tenantId.toString();
          }
        }
      } catch (tokenError) {
        // Token invalid or expired, continue without tenant
      }
    }

    // Load tenant if we have tenantId
    if (tenantId && !tenant) {
      tenant = await Tenant.findById(tenantId);
    }

    // Attach tenant to request
    req.tenant = tenant;
    req.tenantId = tenantId;

    next();
  } catch (error) {
    console.error("Error resolving tenant:", error);
    req.tenant = null;
    req.tenantId = null;
    next();
  }
};

/**
 * Middleware to require tenant (for tenant-scoped routes)
 * Returns 404 if tenant not found
 */
export const requireTenant = async (req, res, next) => {
  if (!req.tenant) {
    return res.status(404).json({
      success: false,
      message: "Tenant not found"
    });
  }

  if (req.tenant.status === 'suspended' || req.tenant.status === 'expired') {
    return res.status(403).json({
      success: false,
      message: `Tenant is ${req.tenant.status}. Please contact support.`
    });
  }

  next();
};

/**
 * Middleware to check subscription status
 * Blocks access if subscription is expired or inactive
 */
export const checkSubscription = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      tenantId: req.tenant._id,
      status: 'active'
    }).sort({ endDate: -1 });

    if (!subscription) {
      return res.status(402).json({
        success: false,
        message: "No active subscription found. Please subscribe to continue."
      });
    }

    // Check if subscription is expired
    if (subscription.endDate < new Date()) {
      console.log(`⏰ Subscription ${subscription._id} for tenant ${req.tenant._id} has expired - updating status immediately`);

      // Update subscription status
      subscription.status = 'expired';
      await subscription.save();

      // Update tenant status
      req.tenant.status = 'expired';
      await req.tenant.save();

      console.log(`🔄 Tenant ${req.tenant.name} status updated to expired due to expired subscription`);

      // Send email notification to tenant admins
      try {
        const tenantAdmins = await Admin.find({ tenantId: req.tenant._id });
        for (const admin of tenantAdmins) {
          await sendSubscriptionExpiredNotification(
            admin.email,
            admin.name,
            {
              planName: subscription.planName,
              endDate: subscription.endDate,
              renewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard`
            }
          );
        }
        console.log(`📧 Expiry notifications sent to ${tenantAdmins.length} admin(s) for tenant ${req.tenant._id}`);
      } catch (emailError) {
        console.error(`Failed to send expiry notifications for tenant ${req.tenant._id}:`, emailError);
      }

      return res.status(402).json({
        success: false,
        message: "Subscription has expired. Please renew to continue.",
        action: "logout_required"
      });
    }

    // Attach subscription to request
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking subscription status"
    });
  }
};

/**
 * Middleware to check if user is SUPER_ADMIN
 * SUPER_ADMIN can access all tenants and bypass tenant checks
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");
    
    const admin = await Admin.findById(decoded.id);
    
    if (!admin || admin.adminRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: "Super admin access required"
      });
    }

    req.superAdmin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

/**
 * Middleware to check tenant access
 * Ensures admin/user can only access their own tenant's data
 * SUPER_ADMIN bypasses this check
 */
export const checkTenantAccess = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_in_production");
    
    // Check if SUPER_ADMIN (can access any tenant)
    const admin = await Admin.findById(decoded.id);
    if (admin && admin.adminRole === 'SUPER_ADMIN') {
      req.user = admin;
      req.isSuperAdmin = true;
      return next();
    }

    // For regular admins/users, check tenant match
    if (admin && admin.tenantId) {
      if (req.tenantId && admin.tenantId.toString() !== req.tenantId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Tenant mismatch"
        });
      }
      req.user = admin;
      req.isSuperAdmin = false;
      return next();
    }

    // Check if it's a regular user
    const User = (await import("../models/users.model.js")).default;
    const user = await User.findById(decoded.id);
    if (user && user.tenantId) {
      if (req.tenantId && user.tenantId.toString() !== req.tenantId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Tenant mismatch"
        });
      }
      req.user = user;
      req.isSuperAdmin = false;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

/**
 * Middleware to check role-based access
 * @param {...string} allowedRoles - Roles that can access this route
 */
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      // SUPER_ADMIN can access everything
      if (req.isSuperAdmin || req.user.adminRole === 'SUPER_ADMIN') {
        return next();
      }

      // Check if user's role is allowed
      const userRole = req.user.adminRole || 'USER';
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error checking role"
      });
    }
  };
};



