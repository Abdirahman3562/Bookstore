import Admin from "../models/admin.model.js";
import { sendOTPEmail } from "../utils/email.js";
import { createOTP, verifyOTP as verifyOTPCode, isVerified, clearOTP } from "../utils/otpStore.js";

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if email exists in Admin model
    let admin;
    try {
      admin = await Admin.findOne({ email });
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: dbError.message
      });
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "This email is not registered as an admin user"
      });
    }

    const otp = generateOTP();
    createOTP(email, otp);
    
    try {
      await sendOTPEmail(email, otp);
      console.log(`✅ OTP sent successfully to ${email}`);
      
      return res.json({
        success: true,
        message: "OTP sent to your email"
      });
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
      console.error("❌ Error code:", emailError.code);
      console.error("❌ Error command:", emailError.command);
      console.error("❌ Error response:", emailError.response);
      console.error("❌ Error responseCode:", emailError.responseCode);
      console.log(`📧 OTP for ${email}: ${otp} (valid for 10 minutes - email sending failed)`);
      
      // Return detailed error message
      let errorMessage = "Failed to send email";
      if (emailError.code === "EAUTH") {
        errorMessage = "Email authentication failed. Please check your email App Password in .env file.";
      } else if (emailError.code === "ECONNECTION") {
        errorMessage = "Email connection failed. Please check your internet connection.";
      } else if (emailError.responseCode === 535) {
        errorMessage = "Invalid App Password. Please generate a new one from Google Account settings.";
      } else if (emailError.message) {
        errorMessage = emailError.message;
      }
      
      // Return error with OTP for development/testing
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: emailError.message,
        errorCode: emailError.code,
        errorResponseCode: emailError.responseCode,
        // Always return OTP in development for testing
        ...(process.env.NODE_ENV !== 'production' && { 
          otp: otp,
          note: "Check server console for detailed error logs"
        })
      });
    }

  } catch (err) {
    console.error("❌ Unexpected error in sendOTP:", err);
    console.error("❌ Error stack:", err.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
      ...(process.env.NODE_ENV !== 'production' && { 
        stack: err.stack 
      })
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const valid = verifyOTPCode(email, otp);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    res.json({
      success: true,
      message: "OTP verified"
    });

  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }

    // Verify OTP if provided (for security)
    if (otp && !isVerified(email)) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified"
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found"
      });
    }

    // Save password as plain text (no hashing)
    admin.password = newPassword;
    await admin.save();

    // Clear OTP after successful password reset
    clearOTP(email);

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
