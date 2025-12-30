import WebsiteSettings from "../models/websiteSettings.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadLogo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for logo'));
    }
    cb(null, true);
  }
});

// GET website settings
export const getWebsiteSettings = async (req, res) => {
  try {
    const settings = await WebsiteSettings.getSettings(req.tenantId);
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching website settings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching website settings",
    });
  }
};

// UPDATE website settings
export const updateWebsiteSettings = async (req, res) => {
  try {
    console.log("📝 Received form data:", req.body);
    console.log("📍 Location from body:", req.body.location);
    
    let settings = await WebsiteSettings.findOne({ tenantId: req.tenantId });

    if (!settings) {
      settings = new WebsiteSettings({ tenantId: req.tenantId });
    }

    // Update website name if provided
    if (req.body.websiteName) {
      settings.websiteName = req.body.websiteName;
    }

    // Update support email if provided
    if (req.body.supportEmail !== undefined) {
      settings.supportEmail = req.body.supportEmail;
    }

    // Update phone number if provided
    if (req.body.phoneNumber !== undefined) {
      settings.phoneNumber = req.body.phoneNumber;
    }

    // Update location if provided (including empty string to clear it)
    if (req.body.location !== undefined) {
      settings.location = req.body.location || "";
      console.log("📍 Location updated:", req.body.location || "(empty)");
    }

    // Update logo if file is uploaded
    if (req.file) {
      // Delete old logo if exists
      if (settings.websiteLogo && settings.websiteLogo.startsWith('/uploads/logos/')) {
        const oldLogoPath = path.join(process.cwd(), settings.websiteLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      // Set new logo path
      settings.websiteLogo = `/uploads/logos/${req.file.filename}`;
    } else if (req.body.websiteLogo !== undefined) {
      // Allow setting logo URL directly
      settings.websiteLogo = req.body.websiteLogo;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Website settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating website settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating website settings",
    });
  }
};



