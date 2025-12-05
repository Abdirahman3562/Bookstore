import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";

// GET ALL ADMINS
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).sort({ createdAt: -1 });
    
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
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: admin
    });
  } catch (err) {
    console.error("Error fetching admin:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE ADMIN
export const updateAdmin = async (req, res) => {
  try {
    const { name, email, password, avatar, adminRole, permissions, currentPassword } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // If password is being changed and currentPassword is provided, verify it
    // If currentPassword is not provided, allow password change (admin editing another admin)
    if (password && currentPassword) {
      // Check if stored password is hashed (starts with $2a$ or $2b$) or plain text (for legacy)
      const isHashed = admin.password && (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'));
      
      if (isHashed) {
        // Compare hashed password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect"
          });
        }
      } else {
        // Legacy plain text comparison (for backward compatibility)
        if (currentPassword !== admin.password) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect"
          });
        }
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      // Hash password with bcrypt before saving
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }
    if (avatar !== undefined) updateData.avatar = avatar;
    if (adminRole) updateData.adminRole = adminRole;
    if (permissions) updateData.permissions = permissions;
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

// CREATE ADMIN
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminRole, permissions } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      adminRole: adminRole || 'author',
      permissions: permissions || {
        dashboard: false,
        books: false,
        downloads: false,
        purchased: false,
        testimonials: false,
        users: false,
        authors: false,
        blogs: true,
        addAdminUser: false
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

