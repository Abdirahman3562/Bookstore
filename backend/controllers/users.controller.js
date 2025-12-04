import User from "../models/users.model.js";
import Purchased from "../models/purchased.model.js";
import Download from "../models/downloads.model.js";

// GET ALL USERS with purchase and download statistics
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    // Get statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Convert user._id to string for matching (since downloads uses String userId)
        const userIdString = user._id.toString();
        const userIdObjectId = user._id;
        
        // Get downloads from Downloads collection - try both ObjectId and string
        const downloads = await Download.find({
          $or: [
            { userId: userIdString },
            { userId: userIdObjectId }
          ]
        });
        const downloadsCount = downloads.length;
        
        // Get purchases from Purchased collection - try both ObjectId and string
        const purchases = await Purchased.find({
          $or: [
            { userId: userIdString },
            { userId: userIdObjectId }
          ]
        });
        const purchasesCount = purchases.length;
        
        // Calculate role based on purchase count (4+ = premium)
        const role = purchasesCount >= 4 ? 'premium' : 'regular';
        
        // Update user role if changed
        if (user.role !== role) {
          await User.findByIdAndUpdate(user._id, { role });
        }
        
        // Calculate status: active if has purchases or downloads, inactive if none
        // But only auto-update if status was not manually set by admin
        let status = user.status;
        if (!user.statusManuallySet) {
          // Auto-calculate: active if has purchases or downloads, inactive if none
          const calculatedStatus = (purchasesCount > 0 || downloadsCount > 0) ? 'active' : 'inactive';
          if (user.status !== calculatedStatus) {
            await User.findByIdAndUpdate(user._id, { status: calculatedStatus });
            status = calculatedStatus;
          }
        }
        // If statusManuallySet is true, keep the current status as is
        
        return {
          ...user.toObject(),
          downloadsCount: downloadsCount,
          purchasesCount: purchasesCount,
          role,
          status
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: usersWithStats,
      count: usersWithStats.length
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE USER
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Convert user._id to string for matching
    const userIdString = user._id.toString();
    const userIdObjectId = user._id;
    
    // Get downloads from Downloads collection - try both ObjectId and string
    const downloads = await Download.find({
      $or: [
        { userId: userIdString },
        { userId: userIdObjectId }
      ]
    });
    const downloadsCount = downloads.length;
    
    // Get purchases from Purchased collection - try both ObjectId and string
    const purchases = await Purchased.find({
      $or: [
        { userId: userIdString },
        { userId: userIdObjectId }
      ]
    });
    const purchasesCount = purchases.length;
    
    // Calculate role based on purchase count (4+ = premium)
    const role = purchasesCount >= 4 ? 'premium' : 'regular';

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: {
        ...user.toObject(),
        downloadsCount: downloadsCount,
        purchasesCount: purchasesCount,
        role
      }
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, avatar, currentPassword } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If password is being changed, verify current password
    if (password) {
      if (!currentPassword || currentPassword !== user.password) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating user:", err);
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

// UPDATE USER STATUS (activate/deactivate)
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: active or inactive"
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Direct status update: set the status as requested and mark as manually set
    // This ensures the status is tracked and won't be auto-updated
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: status,
        statusManuallySet: true // Mark as manually set so it won't be auto-updated
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE USER (for admin user creation)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, adminRole, permissions, role, status } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const newUser = new User({
      name,
      email,
      password,
      adminRole: adminRole || null,
      permissions: permissions || {},
      role: role || 'regular',
      status: status || 'active',
      statusManuallySet: true
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser
    });
  } catch (err) {
    console.error("Error creating user:", err);
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

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
