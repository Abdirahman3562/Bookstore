import Admin from "../models/admin.model.js";
import User from "../models/users.model.js";
import jwt from "jsonwebtoken";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for email:", email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // First check Admin model
    let admin = await Admin.findOne({ email }).lean();
    let isFromUserModel = false;
    
    console.log("Admin model check:", admin ? "Found" : "Not found");
    
    // If not found in Admin model, check User model with adminRole (legacy support)
    if (!admin) {
      const user = await User.findOne({ 
        email,
        adminRole: { $in: ['admin', 'author'] }
      }).lean();
      
      console.log("User model check:", user ? "Found" : "Not found");
      
      if (user) {
        // Check password (plain text comparison for now)
        if (user.password === password) {
          admin = {
            _id: user._id,
            name: user.name,
            email: user.email,
            adminRole: user.adminRole,
            permissions: user.permissions
          };
          isFromUserModel = true;
          console.log("User password matched, adminRole:", user.adminRole);
        } else {
          console.log("User password mismatch");
          return res.status(400).json({
            success: false,
            message: "Invalid email or password",
          });
        }
      }
    } else {
      // Admin model found, ensure name is included
      if (!admin.name) {
        admin.name = admin.email.split('@')[0]; // Fallback to email username
      }
    }

    if (!admin) {
      console.log("No admin found in either model");
      return res.status(400).json({
        success: false,
        message: "Admin not found or invalid credentials",
      });
    }

    // For Admin model, check password directly
    if (!isFromUserModel && admin.password && admin.password !== password) {
      console.log("Admin password mismatch");
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "1d" }
    );

    console.log("Login successful, token generated");

    res.status(200).json({
      success: true,
      token,
      message: "Login successful",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        adminRole: admin.adminRole,
        permissions: admin.permissions
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};
