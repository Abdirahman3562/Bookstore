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
    console.log("📧 Website settings fetched:", {
      name: settings.websiteName,
      logo: settings.websiteLogo,
      logoExists: !!settings.websiteLogo
    });
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
    const websiteSettings = await getWebsiteSettings();
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const logoUrl = websiteSettings.logo ? `${backendUrl}${websiteSettings.logo}` : '';

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

    // Format from field with website name
    // Note: Email clients generate avatars from sender name, so we use website name directly
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const fromName = websiteSettings.name || "Bookstore";
    const fromField = `${fromName} <${fromEmail}>`;

    // Logo removed - not showing in emails
    const logoHtml = '';

    // Compact HTML to prevent Gmail clipping (keep under 102KB)
    const mailOptions = {
      from: fromField,
      to: email,
      subject: `Your OTP Code (${websiteSettings.name})`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">${logoHtml}<h2 style="color:#333;margin-top:0">Your OTP Code</h2><p style="font-size:16px;margin:20px 0">Use the following OTP to reset your password:</p><div style="background:#f0f0f0;padding:30px;text-align:center;margin:30px 0;border-radius:8px;border:2px solid #667eea"><div style="font-size:48px;font-weight:bold;letter-spacing:8px;color:#667eea;margin:0;font-family:monospace">${otp}</div></div><p style="font-size:14px;color:#333;margin:20px 0"><strong>This code expires in ${expirationMinutes} minutes.</strong></p><p style="font-size:12px;color:#666;margin-top:30px">If you didn't request this code, please ignore this email.</p><p style="font-size:12px;color:#666;margin-top:10px">Best regards,<br>${websiteSettings.name} Team</p></div>`,
      text: `Your OTP Code: ${otp}\n\nThis code expires in ${expirationMinutes} minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\n${websiteSettings.name} Team`,
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

    const websiteSettings = await getWebsiteSettings();

    // Format from field with website name
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const fromName = websiteSettings.name || "Bookstore";
    const fromField = `${fromName} <${fromEmail}>`;

    // Logo removed - not showing in emails
    const logoHtml = '';

    // Compact HTML to prevent Gmail clipping (keep under 102KB)
    const mailOptions = {
      from: fromField,
      to: email,
      subject: `Your Login Verification Code (${websiteSettings.name})`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">${logoHtml}<h2 style="color:#333;margin-top:0">Login Verification Code</h2><p style="font-size:16px">Hello ${name},</p><p style="font-size:16px;margin:20px 0">You have requested to login to your admin account. Please use the following verification code:</p><div style="background:#f0f0f0;padding:30px;text-align:center;margin:30px 0;border-radius:8px;border:2px solid #667eea"><div style="font-size:48px;font-weight:bold;letter-spacing:8px;color:#667eea;margin:0;font-family:monospace">${code}</div></div><p style="font-size:14px;color:#333;margin:20px 0"><strong>This code will expire in 10 minutes.</strong></p><p style="font-size:12px;color:#666;margin-top:30px">If you didn't request this code, please ignore this email and secure your account.</p><p style="font-size:12px;color:#666;margin-top:10px">Best regards,<br>${websiteSettings.name} Team</p></div>`,
      text: `Login Verification Code: ${code}\n\nHello ${name},\n\nYou have requested to login to your admin account. Please use the following verification code:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email and secure your account.\n\nBest regards,\n${websiteSettings.name} Team`,
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

// Send order active email
export const sendOrderActiveEmail = async (email, userName, bookTitle, bookAuthor, downloadUrl) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("❌ Email credentials not configured in .env file");
      throw new Error("Email credentials not configured");
    }

    const websiteSettings = await getWebsiteSettings();
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const dashboardUrl = `${backendUrl}/dashboard/downloads`;

    // Format from field with website name
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const fromName = websiteSettings.name || "Bookstore";
    const fromField = `${fromName} <${fromEmail}>`;

    // Beautiful HTML email design
    const mailOptions = {
      from: fromField,
      to: email,
      subject: `🎉 Your Book is Now Active - Ready to Download! (${websiteSettings.name})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f7fa">
          <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f7fa">
            <tr>
              <td style="padding:40px 20px">
                <table role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden">
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:40px 30px;text-align:center">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold">🎉 Great News!</h1>
                      <p style="margin:10px 0 0;color:#ffffff;font-size:16px;opacity:0.9">Your Book is Now Active</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding:40px 30px">
                      <p style="margin:0 0 20px;color:#333333;font-size:16px;line-height:1.6">
                        Hello <strong>${userName}</strong>,
                      </p>
                      <p style="margin:0 0 25px;color:#333333;font-size:16px;line-height:1.6">
                        We're excited to inform you that your order has been approved and your book is now <strong style="color:#10b981">active</strong>! You can now download your book and start reading.
                      </p>
                      
                      <!-- Book Info Card -->
                      <div style="background-color:#f8f9fa;border-left:4px solid #667eea;padding:20px;border-radius:8px;margin:30px 0">
                        <h2 style="margin:0 0 10px;color:#333333;font-size:20px;font-weight:bold">${bookTitle}</h2>
                        <p style="margin:0;color:#666666;font-size:14px">by ${bookAuthor}</p>
                      </div>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width:100%;margin:30px 0">
                        <tr>
                          <td style="text-align:center">
                            <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;box-shadow:0 4px 6px rgba(102,126,234,0.3)">
                              📥 Download Your Book
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin:25px 0 0;color:#666666;font-size:14px;line-height:1.6">
                        You can also access your downloads anytime from your <a href="${dashboardUrl}" style="color:#667eea;text-decoration:none">dashboard</a>.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f8f9fa;padding:30px;text-align:center;border-top:1px solid #e5e7eb">
                      <p style="margin:0 0 10px;color:#666666;font-size:14px">
                        Thank you for your purchase!
                      </p>
                      <p style="margin:0;color:#999999;font-size:12px">
                        Best regards,<br>
                        <strong>${websiteSettings.name} Team</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Great News! Your Book is Now Active\n\nHello ${userName},\n\nWe're excited to inform you that your order has been approved and your book "${bookTitle}" by ${bookAuthor} is now active! You can now download your book and start reading.\n\nDownload your book: ${dashboardUrl}\n\nThank you for your purchase!\n\nBest regards,\n${websiteSettings.name} Team`,
    };

    console.log("📧 Attempting to send order active email to:", email);
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Order active email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    
    return info;
  } catch (error) {
    console.error("❌ Error sending order active email:", error);
    throw error;
  }
};

