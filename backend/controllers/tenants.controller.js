import Tenant from "../models/tenant.model.js";
import Subscription from "../models/subscription.model.js";
import Admin from "../models/admin.model.js";
import User from "../models/users.model.js";
import Book from "../models/books.model.js";
import bcrypt from "bcryptjs";

/**
 * Get all tenants (Super Admin only)
 */
export const getAllTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } }
      ];
    }

    const tenants = await Tenant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tenant.countDocuments(query);

    // Get subscription info for each tenant
    const tenantsWithSubscriptions = await Promise.all(
      tenants.map(async (tenant) => {
        const subscription = await Subscription.findOne({
          tenantId: tenant._id,
          status: 'active'
        }).sort({ endDate: -1 });

        // Get stats
        const [usersCount, booksCount, adminsCount] = await Promise.all([
          User.countDocuments({ tenantId: tenant._id }),
          Book.countDocuments({ tenantId: tenant._id }),
          Admin.countDocuments({ tenantId: tenant._id })
        ]);

        return {
          ...tenant.toObject(),
          subscription: subscription || null,
          stats: {
            users: usersCount,
            books: booksCount,
            admins: adminsCount
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: tenantsWithSubscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tenants",
      error: error.message
    });
  }
};

/**
 * Get single tenant by ID
 */
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    const subscription = await Subscription.findOne({
      tenantId: tenant._id,
      status: 'active'
    }).sort({ endDate: -1 });

    // Get stats
    const [usersCount, booksCount, adminsCount] = await Promise.all([
      User.countDocuments({ tenantId: tenant._id }),
      Book.countDocuments({ tenantId: tenant._id }),
      Admin.countDocuments({ tenantId: tenant._id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...tenant.toObject(),
        subscription: subscription || null,
        stats: {
          users: usersCount,
          books: booksCount,
          admins: adminsCount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tenant",
      error: error.message
    });
  }
};

/**
 * Create new tenant
 */
export const createTenant = async (req, res) => {
  try {
    const {
      name,
      subdomain,
      domain,
      contactEmail,
      contactName,
      contactPhone,
      plan = 'basic',
      billingCycle = 'monthly',
      startDate,
      endDate
    } = req.body;

    // Validate required fields
    if (!name || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: "Name and contact email are required"
      });
    }

    // Check if subdomain already exists
    if (subdomain) {
      const existingTenant = await Tenant.findOne({ subdomain });
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: "Subdomain already exists"
        });
      }
    }

    // Create tenant
    const tenant = await Tenant.create({
      name,
      subdomain: subdomain || null,
      domain: domain || null,
      contactEmail,
      contactName: contactName || "",
      contactPhone: contactPhone || "",
      status: 'inactive'
    });

    // Create subscription if dates provided
    if (startDate && endDate) {
      await Subscription.create({
        tenantId: tenant._id,
        plan,
        planName: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        billingCycle,
        status: 'active'
      });

      tenant.status = 'active';
      await tenant.save();
    }

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: tenant
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({
      success: false,
      message: "Error creating tenant",
      error: error.message
    });
  }
};

/**
 * Update tenant
 */
export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      subdomain,
      domain,
      contactEmail,
      contactName,
      contactPhone,
      status
    } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Check subdomain uniqueness if changing
    if (subdomain && subdomain !== tenant.subdomain) {
      const existingTenant = await Tenant.findOne({ subdomain });
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: "Subdomain already exists"
        });
      }
    }

    // Update tenant
    if (name) tenant.name = name;
    if (subdomain !== undefined) tenant.subdomain = subdomain;
    if (domain !== undefined) tenant.domain = domain;
    if (contactEmail) tenant.contactEmail = contactEmail;
    if (contactName !== undefined) tenant.contactName = contactName;
    if (contactPhone !== undefined) tenant.contactPhone = contactPhone;
    if (status) tenant.status = status;

    await tenant.save();

    res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: tenant
    });
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({
      success: false,
      message: "Error updating tenant",
      error: error.message
    });
  }
};

/**
 * Suspend tenant
 */
export const suspendTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    tenant.status = 'suspended';
    await tenant.save();

    res.status(200).json({
      success: true,
      message: "Tenant suspended successfully",
      data: tenant
    });
  } catch (error) {
    console.error("Error suspending tenant:", error);
    res.status(500).json({
      success: false,
      message: "Error suspending tenant",
      error: error.message
    });
  }
};

/**
 * Activate tenant
 */
export const activateTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Check if tenant has active subscription
    const subscription = await Subscription.findOne({
      tenantId: tenant._id,
      status: 'active'
    });

    if (!subscription || subscription.endDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Tenant must have an active subscription to be activated"
      });
    }

    tenant.status = 'active';
    await tenant.save();

    res.status(200).json({
      success: true,
      message: "Tenant activated successfully",
      data: tenant
    });
  } catch (error) {
    console.error("Error activating tenant:", error);
    res.status(500).json({
      success: false,
      message: "Error activating tenant",
      error: error.message
    });
  }
};

/**
 * Delete tenant (soft delete by setting status to inactive)
 */
export const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Delete all subscriptions for this tenant (cascade delete)
    const deletedSubscriptions = await Subscription.deleteMany({ tenantId: tenant._id });
    console.log(`🗑️ Deleted ${deletedSubscriptions.deletedCount} subscriptions for tenant ${tenant.name}`);

    // Delete the tenant from database
    await Tenant.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Tenant permanently deleted from database"
    });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting tenant",
      error: error.message
    });
  }
};

/**
 * Create admin for tenant (or SUPER_ADMIN if tenantId is null)
 */
export const createTenantAdmin = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { 
      name, 
      email, 
      password, 
      adminRole = 'admin',
      permissions = {}
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Validate adminRole
    const validRoles = ['SUPER_ADMIN', 'admin', 'author'];
    if (!validRoles.includes(adminRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid admin role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // SUPER_ADMIN must have tenantId = null
    if (adminRole === 'SUPER_ADMIN' && tenantId !== 'null' && tenantId) {
      return res.status(400).json({
        success: false,
        message: "SUPER_ADMIN cannot be assigned to a tenant"
      });
    }

    // Regular admins must have tenantId
    if (adminRole !== 'SUPER_ADMIN' && (!tenantId || tenantId === 'null')) {
      return res.status(400).json({
        success: false,
        message: "Regular admins must be assigned to a tenant"
      });
    }

    // Check if tenant exists (for regular admins)
    if (adminRole !== 'SUPER_ADMIN') {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "Tenant not found"
        });
      }
    }

    // Check if email already exists
    const query = adminRole === 'SUPER_ADMIN' 
      ? { email, adminRole: 'SUPER_ADMIN' }
      : { tenantId, email };
    
    const existingAdmin = await Admin.findOne(query);
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const adminData = {
      name,
      email,
      password: hashedPassword,
      adminRole,
      permissions: permissions || {}
    };

    // Set tenantId based on role
    if (adminRole === 'SUPER_ADMIN') {
      adminData.tenantId = null;
    } else {
      adminData.tenantId = tenantId;
    }

    const admin = await Admin.create(adminData);

    res.status(201).json({
      success: true,
      message: `${adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} created successfully`,
      data: admin
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      message: "Error creating admin",
      error: error.message
    });
  }
};

/**
 * Get tenant admins
 */
export const getTenantAdmins = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const admins = await Admin.find({ tenantId })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error("Error fetching tenant admins:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tenant admins",
      error: error.message
    });
  }
};

