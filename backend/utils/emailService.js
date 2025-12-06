import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import WebsiteSettings from "../models/websiteSettings.model.js";

dotenv.config();

// Helper function to get website settings
const getWebsiteSettings = async () => {
  try {
    const settings = await WebsiteSettings.getSettings();
    return {
      name: settings.websiteName || "Bookstore",
      logo: settings.websiteLogo || "",
    };
  } catch (error) {
    console.error("Error fetching website settings:", error);
    return {
      name: "Bookstore",
      logo: "",
    };
  }
};

// Create transporter for sending emails
const createTransport = () => {
  // For Gmail, you can use App Password
  if (process.env.EMAIL_SERVICE === "gmail" && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD, // App Password for Gmail
        },
      });
    } catch (error) {
      console.error("Error creating Gmail transporter:", error);
    }
  }

  // Option 2: SMTP (works with any email provider)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } catch (error) {
      console.error("Error creating SMTP transporter:", error);
    }
  }

  // Development mode - log email instead of sending
  return {
    sendMail: async (options) => {
      const otpMatch = options.text.match(/OTP Code: (\d{6})/);
      const otp = otpMatch ? otpMatch[1] : "N/A";
      
      console.log("\n📧 ========== EMAIL (Development Mode - Not Sent) ==========");
      console.log("⚠️  Email credentials not configured. Email was NOT sent.");
      console.log("To:", options.to);
      console.log("Subject:", options.subject);
      console.log("\n--- OTP Code (for testing) ---");
      console.log("OTP:", otp);
      console.log("\n--- Full Email Content ---");
      console.log(options.text);
      console.log("===================================================\n");
      console.log("💡 To enable email sending, configure EMAIL_SERVICE and EMAIL_USER in .env file");
      return { messageId: "dev-mode", otp: otp };
    },
  };
};

// Send OTP email
export const sendOTPEmail = async (email, otp, name = "User") => {
  try {
    const transporter = createTransport();
    const expirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES) || 10;
    const websiteSettings = await getWebsiteSettings();

    // Format from field with website name
    // Note: Some email clients use the sender name to generate avatars
    // Using the website name directly might help with avatar generation
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@bookstore.com";
    const fromName = websiteSettings.name || "Bookstore";
    // Try to use just the website name without "Support" to get better avatar
    const fromField = `${fromName} <${fromEmail}>`;

    // Logo removed - not showing in emails
    const logoHtml = '';

    // Compact HTML to prevent Gmail clipping (keep under 102KB)
    const mailOptions = {
      from: fromField,
      to: email,
      subject: `Your OTP Code for Password Reset - ${websiteSettings.name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9"><div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0">${logoHtml}<h1 style="margin:10px 0">Password Reset OTP</h1></div><div style="background:white;padding:30px;border-radius:0 0 10px 10px"><p style="font-size:16px">Hello ${name},</p><p style="font-size:16px;margin:20px 0">You have requested to reset your password. Please use the following OTP code to verify your identity:</p><div style="background:#f0f0f0;border:2px dashed #667eea;padding:30px;text-align:center;margin:30px 0;border-radius:8px"><div style="font-size:48px;font-weight:bold;color:#667eea;letter-spacing:8px;font-family:monospace;margin:0">${otp}</div></div><p style="font-size:14px;margin:20px 0">This code will expire in <strong>${expirationMinutes} minutes</strong>.</p><p style="font-size:12px;color:#666">If you didn't request this code, please ignore this email.</p><p style="font-size:12px;color:#666;margin-top:20px">Best regards,<br>${websiteSettings.name} Admin Team</p></div><div style="text-align:center;margin-top:20px;color:#666;font-size:12px"><p>This is an automated email. Please do not reply.</p></div></div>`,
      text: `
        Hello ${name},
        
        You have requested to reset your password. Please use the following OTP code to verify your identity:
        
        OTP Code: ${otp}
        
        This code will expire in ${expirationMinutes} minutes.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        Bookstore Admin Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (info.messageId === "dev-mode") {
      console.log("⚠️  Email not sent (dev mode). OTP:", info.otp);
      return { success: true, messageId: info.messageId, devMode: true, otp: info.otp };
    }
    
    console.log("✅ Email sent successfully to", email, "- Message ID:", info.messageId);
    return { success: true, messageId: info.messageId, devMode: false };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    const otpMatch = mailOptions.text.match(/OTP Code: (\d{6})/);
    const otp = otpMatch ? otpMatch[1] : null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log("📧 OTP (email failed):", otp);
      return { success: false, messageId: "failed", devMode: true, otp: otp, error: error.message };
    }
    
    throw { ...error, otp };
  }
};

export default { sendOTPEmail };

