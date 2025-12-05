import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter with better error handling
export const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration (async, non-blocking)
setTimeout(() => {
  transporter.verify(function (error, success) {
    if (error) {
      console.error("❌ Email transporter verification failed:", error);
      console.error("📧 Check your EMAIL_USER and EMAIL_PASSWORD in .env file");
      console.error("📧 Error code:", error.code);
      console.error("📧 Error command:", error.command);
    } else {
      console.log("✅ Email transporter is ready to send emails");
      console.log("📧 Email User:", process.env.EMAIL_USER);
    }
  });
}, 1000);

export const sendOTPEmail = async (email, otp) => {
  try {
    const expirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES) || 10;

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("❌ Email credentials not configured in .env file");
      console.error("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Set" : "❌ Not set");
      console.error("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "✅ Set" : "❌ Not set");
      throw new Error("Email credentials not configured in .env file");
    }

    // Log email config (without password)
    console.log("📧 Email configuration:");
    console.log("  - Service:", process.env.EMAIL_SERVICE || "gmail");
    console.log("  - User:", process.env.EMAIL_USER);
    console.log("  - Password:", process.env.EMAIL_PASSWORD ? "***configured***" : "NOT SET");
    console.log("  - From:", process.env.EMAIL_FROM || process.env.EMAIL_USER);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code (Bookstore)",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Use the following OTP to reset your password:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="font-size: 32px; letter-spacing: 4px; color: #667eea; margin: 0;">${otp}</h1>
          </div>
          <p>This code expires in <strong>${expirationMinutes} minutes</strong></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your OTP code is ${otp}. It expires in ${expirationMinutes} minutes.`,
    };

    console.log("📧 Attempting to send email to:", email);
    console.log("📧 From:", mailOptions.from);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
    
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    console.error("❌ Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Common Gmail errors
    if (error.code === "EAUTH") {
      console.error("❌ Authentication failed. Check your EMAIL_PASSWORD (App Password)");
      console.error("💡 Make sure you're using a Gmail App Password, not your regular password");
    } else if (error.code === "ECONNECTION") {
      console.error("❌ Connection failed. Check your internet connection");
    } else if (error.responseCode === 535) {
      console.error("❌ Authentication failed. Invalid App Password");
      console.error("💡 Generate a new App Password from: https://myaccount.google.com/apppasswords");
    }
    
    throw error;
  }
};

// Send 2-step verification code
export const sendVerificationCode = async (email, code, name = "User") => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("❌ Email credentials not configured in .env file");
      throw new Error("Email credentials not configured");
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Your Login Verification Code (Bookstore)",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Login Verification Code</h2>
          <p>Hello ${name},</p>
          <p>You have requested to login to your admin account. Please use the following verification code:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="font-size: 32px; letter-spacing: 4px; color: #667eea; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">If you didn't request this code, please ignore this email and secure your account.</p>
        </div>
      `,
      text: `Your login verification code is ${code}. It expires in 10 minutes.`,
    };

    console.log("📧 Attempting to send verification code to:", email);
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Verification code sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    
    return info;
  } catch (error) {
    console.error("❌ Error sending verification code:", error);
    throw error;
  }
};

