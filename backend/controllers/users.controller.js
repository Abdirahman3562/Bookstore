import User from "../models/users.model.js";
import Purchased from "../models/purchased.model.js";
import Download from "../models/downloads.model.js";
import WebsiteSettings from "../models/websiteSettings.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { transporter, sendVerificationCode, sendOTPEmail } from "../utils/email.js";
import { createOTP, verifyOTP as verifyOTPCode, clearOTP, isVerified } from "../utils/otpStore.js";

// GET ALL USERS with purchase and download statistics
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    
    // Get statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Convert user._id to string for matching (since downloads uses String userId)
        const userIdString = user._id.toString();
        const userIdObjectId = user._id;
        
        // Get downloads from Downloads collection - try both ObjectId and string
        const downloads = await Download.find({
          tenantId: req.tenantId,
          $or: [
            { userId: userIdString },
            { userId: userIdObjectId }
          ]
        });
        const downloadsCount = downloads.length;
        
        // Get purchases from Purchased collection - try both ObjectId and string
        const purchases = await Purchased.find({
          tenantId: req.tenantId,
          $or: [
            { userId: userIdString },
            { userId: userIdObjectId }
          ]
        });
        const purchasesCount = purchases.length;
        
        // Calculate role based on purchase count (4+ = premium) - only for display, don't auto-update
        const role = purchasesCount >= 4 ? 'premium' : (user.role || 'regular');
        
        // Don't auto-update role or status for regular users
        // Status should only change when:
        // 1. User verifies email (inactive → active) - handled in verifyEmail
        // 2. Admin manually changes it - handled in updateUserStatus
        // Role should only be set by admin or based on purchases (but don't auto-update in DB)
        
        // Keep the current status from database (don't auto-calculate)
        const status = user.status || 'inactive';
        
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
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Convert user._id to string for matching
    const userIdString = user._id.toString();
    const userIdObjectId = user._id;
    
    // Get downloads from Downloads collection - try both ObjectId and string
    const downloads = await Download.find({
      tenantId: req.tenantId,
      $or: [
        { userId: userIdString },
        { userId: userIdObjectId }
      ]
    });
    const downloadsCount = downloads.length;
    
    // Get purchases from Purchased collection - try both ObjectId and string
    const purchases = await Purchased.find({
      tenantId: req.tenantId,
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

    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If password is being changed, verify current password
    if (password && password !== user.password) {
      // Only require current password if password is actually being changed
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to change password"
        });
      }
      
      // Check if stored password is hashed or plain text
      const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
      let passwordMatch = false;
      
      if (isHashed) {
        passwordMatch = await bcrypt.compare(currentPassword, user.password);
      } else {
        passwordMatch = currentPassword === user.password;
      }
      
      if (!passwordMatch) {
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
    if (req.body.twoStepVerification !== undefined) updateData.twoStepVerification = req.body.twoStepVerification;

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
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

// USER LOGIN with 2-step verification support
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate random 6-digit OTP for password reset
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before logging in. Check your inbox for the verification link."
      });
    }

    // Check if user status is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support to activate your account."
      });
    }

    // Check password (support both hashed and plain text for backward compatibility)
    const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
    let passwordMatch = false;

    if (isHashed) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = user.password === password;
    }

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if 2-step verification is enabled
    if (user.twoStepVerification) {
      // Generate verification code
      const verificationCode = generateVerificationCode();
      createOTP(email.toLowerCase(), verificationCode);

      // Send verification code via email
      try {
        await sendVerificationCode(email.toLowerCase(), verificationCode, user.name || "User");
        console.log(`✅ Verification code sent to ${email}`);
      } catch (emailError) {
        console.error("❌ Error sending verification code:", emailError);
        console.log(`📧 Verification code for ${email}: ${verificationCode} (email sending failed)`);
      }

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        message: "Verification code sent to your email",
        email: email.toLowerCase(),
        ...(process.env.NODE_ENV !== 'production' && { verificationCode: verificationCode })
      });
    }

    // Generate JWT token for user authentication
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ? user.tenantId.toString() : null
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "7d" } // 7 days for regular users
    );

    // If 2-step verification is disabled, return user data and token for login
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      data: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        twoStepVerification: user.twoStepVerification,
        tenantId: user.tenantId
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

// Verify login code for 2-step verification (for regular users)
export const verifyUserLoginCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required"
      });
    }

    // Verify the code
    const valid = verifyOTPCode(email.toLowerCase(), code);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user status is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support to activate your account."
      });
    }

    // Clear verification code after successful login
    clearOTP(email.toLowerCase());

    // Generate JWT token for user authentication
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ? user.tenantId.toString() : null
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "7d" } // 7 days for regular users
    );

    console.log("2-step verification successful for user:", email);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      data: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        twoStepVerification: user.twoStepVerification,
        tenantId: user.tenantId
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

    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Direct status update: set the status as requested and mark as manually set
    // This ensures the status is tracked and won't be auto-updated
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
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

// CREATE USER (for admin user creation and public signup)
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // Token expires in 24 hours

    // For regular users (client signup), only save essential fields
    // For admin users, include adminRole and permissions
    let userData;
    
    if (adminRole) {
      // Admin user creation - include all fields
      userData = {
        tenantId: req.tenantId, // Add tenantId from middleware
        name,
        email,
        password,
        avatar: "", // Default empty avatar
        status: status || 'active',
        verificationToken,
        verificationTokenExpires,
        isEmailVerified: true, // Admin users don't need email verification
        twoStepVerification: false,
        adminRole: adminRole,
        permissions: permissions || {},
        role: role || 'regular',
        statusManuallySet: true
      };
    } else {
      // Regular user signup - only essential fields, explicitly exclude admin fields
      // Status starts as 'inactive' until email is verified
      userData = {
        tenantId: req.tenantId, // Add tenantId from middleware
        name,
        email,
        password,
        avatar: "",
        status: 'inactive', // Set to inactive until email is verified
        verificationToken,
        verificationTokenExpires,
        isEmailVerified: false,
        twoStepVerification: false,
        // Explicitly set admin fields to undefined to prevent schema defaults
        adminRole: undefined,
        permissions: undefined,
        role: undefined,
        statusManuallySet: undefined
      };
    }

    const newUser = new User(userData);
    await newUser.save();
    
    // For regular users, remove admin-related fields from the database
    if (!adminRole) {
      await User.findByIdAndUpdate(newUser._id, {
        $unset: {
          adminRole: "",
          permissions: "",
          role: "",
          statusManuallySet: ""
        }
      });
    }

    let emailSent = false;
    let emailError = null;

    // Send verification email only for regular users (not admin users)
    if (!adminRole) {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error("❌ Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file");
        emailError = "Email service not configured. Please contact administrator.";
      } else {
        try {
          // Get website settings
          const websiteSettings = await WebsiteSettings.getSettings();
          
          // Format from field with website name
          // Note: Some email clients use the sender name to generate avatars
          // Using the website name directly might help with avatar generation
          const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
          const fromName = websiteSettings.websiteName || "Bookstore";
          // Try to use just the website name without "Support" to get better avatar
          const fromField = `${fromName} <${fromEmail}>`;
          
          // Logo removed - not showing in emails
          const logoHtml = '';
          
          const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
          
          // Compact HTML to prevent Gmail clipping (keep under 102KB)
          const mailOptions = {
            from: fromField,
            to: email,
            subject: `Verify Your Email - ${websiteSettings.websiteName}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">${logoHtml}<h2 style="color:#333;margin-top:0">Welcome to ${websiteSettings.websiteName}!</h2><p style="font-size:16px">Hello ${name},</p><p style="font-size:16px;margin:20px 0">Thank you for signing up! Please verify your email address by clicking the button below:</p><div style="text-align:center;margin:30px 0"><a href="${verificationUrl}" style="background-color:#2563eb;color:white;padding:15px 40px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;font-size:16px">Verify Email Address</a></div><p style="font-size:14px;margin:20px 0">Or copy and paste this link into your browser:</p><p style="color:#2563eb;font-size:12px;word-break:break-all;background:#f0f0f0;padding:10px;border-radius:5px">${verificationUrl}</p><p style="color:#666;font-size:12px;margin-top:20px">This link will expire in 24 hours.</p><p style="color:#666;font-size:12px">If you didn't create an account, please ignore this email.</p><p style="color:#666;font-size:12px;margin-top:10px">Best regards,<br>${websiteSettings.websiteName} Team</p></div>`,
            text: `Welcome to ${websiteSettings.websiteName}!\n\nHello ${name},\n\nThank you for signing up! Please verify your email address by clicking this link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\n${websiteSettings.websiteName} Team`
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
          console.log(`✅ Verification email sent to: ${email}`);
        } catch (emailErr) {
          console.error("❌ Error sending verification email:", emailErr);
          emailError = emailErr.message || "Failed to send verification email";
        }
      }
    } else {
      // Admin users don't need email verification
      emailSent = true;
    }

    // Reload user to get the updated document (without admin fields for regular users)
    const finalUser = await User.findById(newUser._id);
    
    res.status(201).json({
      success: true,
      message: adminRole 
        ? "User created successfully" 
        : emailSent 
          ? "Account created! Please check your email to verify your account."
          : "Account created, but verification email could not be sent. Please contact support.",
      data: finalUser,
      emailSent: emailSent,
      emailError: emailError,
      verificationToken: emailSent ? null : verificationToken // Only send token if email failed (for manual verification)
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
    const deleted = await User.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });

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

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Token and email are required"
      });
    }

    // Find user by email and verification token
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      verificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link"
      });
    }

    // Check if token has expired
    if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification link has expired. Please sign up again."
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified"
      });
    }

    // Verify the email and set status to active
    user.isEmailVerified = true;
    user.status = 'active'; // Set status to active after email verification
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now login.",
      data: user
    });
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during verification" 
    });
  }
};

// SEND OTP FOR PASSWORD RESET (for regular users)
export const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email not found"
      });
    }

    // Generate OTP
    const otp = generateOTP();
    createOTP(email.toLowerCase(), otp);

    // Send OTP via email
    try {
      await sendOTPEmail(email.toLowerCase(), otp);
      console.log(`✅ Password reset OTP sent to ${email}`);
      
      return res.json({
        success: true,
        message: "OTP sent to your email",
        email: email.toLowerCase()
      });
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
      console.log(`📧 OTP for ${email}: ${otp} (email sending failed)`);
      
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please try again.",
        ...(process.env.NODE_ENV !== 'production' && { otp: otp })
      });
    }

  } catch (err) {
    console.error("Error sending password reset OTP:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// VERIFY OTP FOR PASSWORD RESET (for regular users)
export const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    // Verify OTP
    const valid = verifyOTPCode(email.toLowerCase(), otp);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (err) {
    console.error("Error verifying password reset OTP:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// RESET PASSWORD (for regular users)
export const resetUserPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }

    // Verify OTP if provided
    if (otp && !isVerified(email.toLowerCase())) {
      const valid = verifyOTPCode(email.toLowerCase(), otp);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP"
        });
      }
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update password (save as plain text for now, matching existing behavior)
    user.password = newPassword;
    await user.save();

    // Clear OTP after successful password reset
    clearOTP(email.toLowerCase());

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};
