import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";

// GET ALL ADMINS
export const getAllAdmins = async (req, res) => {
  try {
    let query = {};

    // If not SUPER_ADMIN, filter by tenant or allow access to created users
    if (!req.isSuperAdmin) {
      // For regular admins, show:
      // 1. Users from their tenant (if tenantId is set)
      // 2. Users they created (createdBy field)
      // 3. Users with no tenant (platform-wide users)
      if (req.tenantId) {
        query.$or = [
          { tenantId: req.tenantId }, // Users from same tenant
          { createdBy: req.admin._id }, // Users created by this admin
          { tenantId: null } // Platform-wide users
        ];
      } else {
        // If no tenant context, allow access to created users
        query.$or = [
          { createdBy: req.admin._id }, // Users created by this admin
          { tenantId: null } // Platform-wide users
        ];
      }
    }

    const admins = await Admin.find(query).sort({ createdAt: -1 });

    console.log('🔍 Admin query:', {
      user: req.admin?.email,
      isSuperAdmin: req.isSuperAdmin,
      tenantId: req.tenantId,
      query: query,
      resultCount: admins.length
    });

    // Log admin details for debugging
    console.log('👥 Admins found:', admins.map(a => ({
      email: a.email,
      role: a.adminRole,
      tenantId: a.tenantId,
      createdBy: a.createdBy
    })));

    res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      data: admins,
      count: admins.length
    });
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE ADMIN
export const getAdminById = async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // If not SUPER_ADMIN, allow access to:
    // 1. Admins from the same tenant
    // 2. Admins created by the current admin
    // 3. Platform-wide admins
    if (!req.isSuperAdmin) {
      query.$or = [
        { tenantId: req.tenantId },        // Admins from same tenant
        { createdBy: req.admin._id },      // Admins created by this admin
        { tenantId: null }                 // Platform-wide admins
      ];
    }

    const admin = await Admin.findOne(query);
    if (!admin) {
      console.log('❌ Single admin not found with query:', query, 'isSuperAdmin:', req.isSuperAdmin);
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Remove password from response for security
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: adminResponse
    });
  } catch (err) {
    console.error("Error fetching admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET CURRENT ADMIN PROFILE (includes password for profile viewing)
export const getCurrentAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      data: admin // Include password for profile viewing
    });
  } catch (err) {
    console.error("Error fetching admin profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE CURRENT ADMIN PROFILE
export const updateCurrentAdminProfile = async (req, res) => {
  try {
    const { twoStepVerification, avatar } = req.body;

    const updateData = {};
    if (twoStepVerification !== undefined) updateData.twoStepVerification = twoStepVerification;
    if (avatar !== undefined) updateData.avatar = avatar;

    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      data: admin
    });
  } catch (err) {
    console.error("Error updating admin profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE ADMIN
export const updateAdmin = async (req, res) => {
  try {
    const { name, email, password, avatar, adminRole, permissions, authorId, currentPassword } = req.body;

    let query = { _id: req.params.id };

    // If not SUPER_ADMIN, allow access to:
    // 1. Admins from the same tenant
    // 2. Admins created by the current admin
    // 3. Platform-wide admins
    if (!req.isSuperAdmin) {
      query.$or = [
        { tenantId: req.tenantId },        // Admins from same tenant
        { createdBy: req.admin._id },      // Admins created by this admin
        { tenantId: null }                 // Platform-wide admins
      ];
    }

    const admin = await Admin.findOne(query);
    if (!admin) {
      console.log('❌ Admin not found with query:', query, 'isSuperAdmin:', req.isSuperAdmin);
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Check ownership: only allow editing author users created by the current admin
    if (admin.adminRole === 'author' && admin.createdBy && req.admin) {
      if (admin.createdBy.toString() !== req.admin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only edit author users you created"
        });
      }
    }

    // Prevent changing roles for author users (only allow editing author users as authors)
    if (admin.adminRole === 'author' && adminRole && adminRole !== 'author') {
      return res.status(400).json({
        success: false,
        message: "Cannot change role of author users"
      });
    }

    // If password is being changed and currentPassword is provided, verify it
    // If currentPassword is not provided, allow password change (admin editing another admin)
    if (password && currentPassword) {
      // Check if stored password is hashed (starts with $2a$ or $2b$) or plain text (for backward compatibility)
      const isHashed = admin.password && (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'));
      
      let passwordMatch = false;
      if (isHashed) {
        // Compare hashed password (for old encrypted passwords)
        passwordMatch = await bcrypt.compare(currentPassword, admin.password);
      } else {
        // Plain text comparison (new passwords are stored as plain text)
        passwordMatch = currentPassword === admin.password;
      }
      
      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
    }

    // Check if email is being changed and if it already exists in this tenant
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email, tenantId: admin.tenantId });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Email already exists in this tenant"
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      // Store password as plain text (not encrypted)
      updateData.password = password;
    }
    if (avatar !== undefined) updateData.avatar = avatar;
    if (adminRole) updateData.adminRole = adminRole;
    if (permissions) updateData.permissions = permissions;
    if (authorId !== undefined) updateData.authorId = authorId || null;
    if (req.body.twoStepVerification !== undefined) updateData.twoStepVerification = req.body.twoStepVerification;

    const updated = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating admin:", err);
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

// DELETE ADMIN
export const deleteAdmin = async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // If not SUPER_ADMIN, allow access to:
    // 1. Admins from the same tenant
    // 2. Admins created by the current admin
    // 3. Platform-wide admins
    if (!req.isSuperAdmin) {
      query.$or = [
        { tenantId: req.tenantId },        // Admins from same tenant
        { createdBy: req.admin._id },      // Admins created by this admin
        { tenantId: null }                 // Platform-wide admins
      ];
    }

    const admin = await Admin.findOne(query);
    if (!admin) {
      console.log('❌ Delete admin not found with query:', query, 'isSuperAdmin:', req.isSuperAdmin);
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Check ownership: only allow deleting author users created by the current admin
    if (admin.adminRole === 'author' && admin.createdBy && req.admin) {
      if (admin.createdBy.toString() !== req.admin._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only delete author users you created"
        });
      }
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE ADMIN
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminRole, permissions, authorId, tenantId: requestedTenantId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Get the creator (current logged in admin)
    const creator = req.user;
    if (!creator) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Determine tenantId for the new admin - CRITICAL FOR MULTI-TENANT SECURITY
    let tenantId = null;

    if (adminRole === 'SUPER_ADMIN') {
      // Only SUPER_ADMIN can create other SUPER_ADMINS
      if (creator.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: "Only Super Admin can create Super Admin accounts"
        });
      }
      tenantId = null; // SUPER_ADMIN has no tenant restriction
    } else if (adminRole === 'admin' || adminRole === 'author') {
      // Regular admins and authors MUST have tenantId
      if (creator.role === 'SUPER_ADMIN') {
        // SUPER_ADMIN can specify tenantId or use their requested tenantId
        tenantId = requestedTenantId || creator.tenantId;
        if (!tenantId) {
          return res.status(400).json({
            success: false,
            message: "Tenant ID is required for admin/author accounts"
          });
        }
      } else {
        // Regular admins can only create users in their own tenant
        tenantId = creator.tenantId;
        if (!tenantId) {
          return res.status(400).json({
            success: false,
            message: "Cannot create admin user: creator has no tenant"
          });
        }
      }
    }

    // Check for existing admin with same email in the SAME tenant (tenant-scoped uniqueness)
    const existingAdmin = await Admin.findOne({
      email,
      tenantId: tenantId // Only check within the same tenant
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: `Admin with email ${email} already exists in this tenant`
      });
    }

    // Hash the password using bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new admin
    const newAdmin = new Admin({
      tenantId: tenantId,
      name,
      email,
      password: hashedPassword, // Store hashed password
      adminRole: adminRole || 'author',
      authorId: authorId || null,
      createdBy: creator.adminId,
      permissions: permissions || {
        dashboard: adminRole === 'admin' ? true : false,
        books: adminRole === 'admin' ? true : false,
        downloads: adminRole === 'admin' ? true : false,
        purchased: false,
        testimonials: false,
        users: false,
        authors: false,
        blogs: true,
        addAdminUser: { view: false, add: false, edit: false, delete: false }
      }
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: newAdmin
    });
  } catch (err) {
    console.error("Error creating admin:", err);
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

