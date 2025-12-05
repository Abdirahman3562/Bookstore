import Admin from "../models/admin.model.js";
import User from "../models/users.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendVerificationCode } from "../utils/email.js";
import { createOTP, verifyOTP as verifyOTPCode, clearOTP } from "../utils/otpStore.js";

// Generate random 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

    // First check Admin model - don't use .lean() to ensure password is accessible
    let admin = await Admin.findOne({ email });
    let isFromUserModel = false;
    
    console.log("Admin model check:", admin ? "Found" : "Not found");
    if (admin) {
      console.log("Admin password type:", admin.password ? (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$') ? "Hashed" : "Plain text") : "No password");
      // Convert to plain object for easier handling
      admin = admin.toObject();
    }
    
    // If not found in Admin model, check User model with adminRole (legacy support)
    if (!admin) {
      const user = await User.findOne({ 
        email,
        adminRole: { $in: ['admin', 'author'] }
      }).lean();
      
      console.log("User model check:", user ? "Found" : "Not found");
      
      if (user) {
        // Check if stored password is hashed (starts with $2a$ or $2b$) or plain text (for legacy)
        const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
        
        let passwordMatch = false;
        if (isHashed) {
          // Compare hashed password
          passwordMatch = await bcrypt.compare(password, user.password);
        } else {
          // Legacy plain text comparison (for backward compatibility)
          passwordMatch = user.password === password;
        }
        
        if (passwordMatch) {
          admin = {
            _id: user._id,
            name: user.name,
            email: user.email,
            adminRole: user.adminRole,
            permissions: user.permissions,
            twoStepVerification: user.twoStepVerification || false,
            password: user.password // Include password for later verification
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
      // Ensure twoStepVerification is included
      admin.twoStepVerification = admin.twoStepVerification || false;
    }

    if (!admin) {
      console.log("No admin found in either model");
      return res.status(400).json({
        success: false,
        message: "Admin not found or invalid credentials",
      });
    }

    // For Admin model, check password
    if (!isFromUserModel && admin.password) {
      // Check if stored password is hashed (starts with $2a$ or $2b$) or plain text (for legacy)
      const isHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
      
      console.log("Password check - Is hashed:", isHashed);
      console.log("Password check - Stored password length:", admin.password.length);
      console.log("Password check - Input password length:", password.length);
      
      let passwordMatch = false;
      if (isHashed) {
        // Compare hashed password
        passwordMatch = await bcrypt.compare(password, admin.password);
        console.log("Password check - Bcrypt comparison result:", passwordMatch);
      } else {
        // Plain text comparison (for forgot password reset)
        passwordMatch = admin.password === password;
        console.log("Password check - Plain text comparison result:", passwordMatch);
        console.log("Password check - Stored:", admin.password);
        console.log("Password check - Input:", password);
      }
      
      if (!passwordMatch) {
        console.log("Admin password mismatch");
        console.log("Debug - Stored password:", admin.password);
        console.log("Debug - Input password:", password);
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }

    // Check if 2-step verification is enabled
    if (admin.twoStepVerification) {
      // Generate verification code
      const verificationCode = generateVerificationCode();
      createOTP(email, verificationCode);
      
      // Send verification code via email
      try {
        await sendVerificationCode(email, verificationCode, admin.name || "User");
        console.log(`✅ Verification code sent to ${email}`);
      } catch (emailError) {
        console.error("❌ Error sending verification code:", emailError);
        console.log(`📧 Verification code for ${email}: ${verificationCode} (email sending failed)`);
      }
      
      return res.status(200).json({
        success: true,
        requiresVerification: true,
        message: "Verification code sent to your email",
        email: email,
        ...(process.env.NODE_ENV !== 'production' && { verificationCode: verificationCode })
      });
    }

    // If 2-step verification is disabled, proceed with normal login
    const token = jwt.sign(
      { id: admin._id, email: admin.email, adminRole: admin.adminRole, permissions: admin.permissions },
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "1d" }
    );

    console.log("Login successful, token generated");

    res.status(200).json({
      success: true,
      token,
      message: "Login successful",
      admin: {
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

// Verify login code for 2-step verification
export const verifyLoginCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required"
      });
    }

    // Verify the code
    const valid = verifyOTPCode(email, code);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    // Find admin/user
    let admin = await Admin.findOne({ email }).lean();
    let isFromUserModel = false;

    if (!admin) {
      const user = await User.findOne({
        email,
        adminRole: { $in: ['admin', 'author'] }
      }).lean();

      if (user) {
        admin = {
          _id: user._id,
          name: user.name,
          email: user.email,
          adminRole: user.adminRole,
          permissions: user.permissions
        };
        isFromUserModel = true;
      }
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, adminRole: admin.adminRole, permissions: admin.permissions },
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "1d" }
    );

    // Clear verification code after successful login
    clearOTP(email);

    console.log("2-step verification successful, token generated");

    res.status(200).json({
      success: true,
      token,
      message: "Login successful",
      admin: {
        name: admin.name,
        email: admin.email,
        adminRole: admin.adminRole,
        permissions: admin.permissions
      }
    });

  } catch (err) {
    console.error("Verify login code error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};
