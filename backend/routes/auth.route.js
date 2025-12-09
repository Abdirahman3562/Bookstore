import express from "express";
import { loginAdmin, verifyLoginCode, logoutAdmin } from "../controllers/auth.controller.js";
import { sendOTP, verifyOTP, resetPassword } from "../controllers/otp.controller.js";
import { transporter } from "../utils/email.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/verify-login-code", verifyLoginCode);
router.post("/logout", logoutAdmin);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Test email configuration endpoint
router.get("/test-email", async (req, res) => {
  try {
    console.log("📧 Testing email configuration...");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("EMAIL_SERVICE:", process.env.EMAIL_SERVICE || "not set (default: gmail)");
    console.log("EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
    console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "***configured***" : "NOT SET");
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "not set");
    console.log("OTP_EXPIRATION_MINUTES:", process.env.OTP_EXPIRATION_MINUTES || "not set (default: 10)");
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(400).json({
        success: false,
        message: "Email credentials not configured in .env file",
        details: {
          EMAIL_USER: process.env.EMAIL_USER ? "✅ Set" : "❌ Not set",
          EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? "✅ Set" : "❌ Not set",
          EMAIL_SERVICE: process.env.EMAIL_SERVICE || "not set",
          EMAIL_FROM: process.env.EMAIL_FROM || "not set"
        },
        help: "Make sure .env file exists in backend folder with EMAIL_USER and EMAIL_PASSWORD"
      });
    }
    
    // Verify transporter
    console.log("📧 Verifying transporter...");
    await transporter.verify();
    console.log("✅ Transporter verified successfully!");
    
    res.json({
      success: true,
      message: "Email configuration is valid and ready to send emails",
      config: {
        service: process.env.EMAIL_SERVICE || "gmail",
        user: process.env.EMAIL_USER,
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        expirationMinutes: parseInt(process.env.OTP_EXPIRATION_MINUTES) || 10
      }
    });
  } catch (error) {
    console.error("❌ Email test failed:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error command:", error.command);
    console.error("❌ Error response:", error.response);
    console.error("❌ Error responseCode:", error.responseCode);
    
    let errorMessage = "Email configuration test failed";
    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Check your EMAIL_PASSWORD (App Password)";
    } else if (error.code === "ECONNECTION") {
      errorMessage = "Connection failed. Check your internet connection";
    } else if (error.responseCode === 535) {
      errorMessage = "Invalid App Password. Generate a new one from Google Account";
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      },
      help: "Check your .env file and make sure EMAIL_PASSWORD is a valid Gmail App Password"
    });
  }
});

export default router;
