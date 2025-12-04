import Admin from "../models/admin.model.js";

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
      if (currentPassword !== admin.password) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
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
    if (password) updateData.password = password;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (adminRole) updateData.adminRole = adminRole;
    if (permissions) updateData.permissions = permissions;

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

    const newAdmin = new Admin({
      name,
      email,
      password,
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

