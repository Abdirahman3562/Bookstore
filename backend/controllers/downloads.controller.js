import Download from "../models/downloads.model.js";
import User from "../models/users.model.js";

// GET ALL DOWNLOADS
export const getAllDownloads = async (req, res) => {
  try {
    const downloads = await Download.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    
    // Fetch user avatars for each download
    const downloadsWithAvatars = await Promise.all(
      downloads.map(async (download) => {
        try {
          const user = await User.findOne({ email: download.email, tenantId: req.tenantId });
          const downloadObj = download.toObject();
          if (user && user.avatar) {
            downloadObj.userAvatar = user.avatar;
          }
          return downloadObj;
        } catch (error) {
          // If user not found or error, return download without avatar
          return download.toObject();
        }
      })
    );
    
    res.status(200).json({
      success: true,
      message: "Downloads fetched successfully",
      data: downloadsWithAvatars,
      count: downloadsWithAvatars.length
    });
  } catch (err) {
    console.error("Error fetching downloads:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE DOWNLOAD
export const getDownloadById = async (req, res) => {
  try {
    const download = await Download.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!download) {
      return res.status(404).json({ success: false, message: "Download not found" });
    }

    res.status(200).json({
      success: true,
      message: "Download fetched successfully",
      data: download
    });
  } catch (err) {
    console.error("Error fetching download:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE NEW DOWNLOAD (Prevent duplicates - one record per user per book)
export const createDownload = async (req, res) => {
  try {
    const { userId, bookId, title, isFree, price } = req.body;

    // Validate required fields
    if (!userId || (!bookId && !title)) {
      console.log("❌ Missing required fields:", { userId: !!userId, bookId: !!bookId, title: !!title });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId and either bookId or title"
      });
    }

    console.log("📥 Creating download record:", {
      userId,
      bookId,
      title,
      isFree,
      price,
      tenantId: req.tenantId
    });

    // Check if download record already exists for this user and book
    // Match by userId AND bookId (primary key) OR fallback to title
    const query = {
      tenantId: req.tenantId, // Add tenantId filter
      userId: userId?.toString()
    };

    // Primary: Match by bookId if available and valid
    if (bookId && typeof bookId === 'string' && bookId.trim().length > 0 && bookId !== 'undefined' && bookId !== 'null') {
      query.bookId = bookId.trim();
      console.log("🔍 Searching for existing download by bookId:", query);
    } else if (title && title.trim().length > 0) {
      // Fallback: Match by title if bookId is not available
      query.title = title.trim();
      console.log("🔍 Searching for existing download by title:", query);
    } else {
      console.log("❌ Cannot create download record: no valid bookId or title provided");
      return res.status(400).json({
        success: false,
        message: "Invalid book data: bookId or title required"
      });
    }

    const existingDownload = await Download.findOne(query);

    if (existingDownload) {
      console.log("🔄 Found existing download record, incrementing count:", {
        id: existingDownload._id,
        currentCount: existingDownload.downloadCount || 1,
        newCount: (existingDownload.downloadCount || 1) + 1
      });

      // Increment download count
      existingDownload.downloadCount = (existingDownload.downloadCount || 1) + 1;
      // Update timestamp to latest download time and reset access
      existingDownload.timestamp = new Date();
      existingDownload.notDownloaded = false; // Reset access if it was revoked
      
      // Update other fields in case they changed
      if (req.body.pdfUrl) existingDownload.pdfUrl = req.body.pdfUrl;
      if (req.body.cover) existingDownload.cover = req.body.cover;
      if (req.body.price !== undefined) {
        existingDownload.price = req.body.price;
        // Always set isFree based on price, not the value sent from frontend
        existingDownload.isFree = req.body.price === 0;
      } else if (req.body.isFree !== undefined) {
        // If price is not provided but isFree is, validate it against current price
        const currentPrice = existingDownload.price || 0;
        existingDownload.isFree = currentPrice === 0;
      }
      
      await existingDownload.save();

      return res.status(200).json({
        success: true,
        message: "Download record updated (already exists)",
        data: existingDownload,
        isUpdate: true
      });
    }

    // Create new download record if it doesn't exist
    console.log("🆕 Creating new download record (no existing record found)");
    // Ensure isFree is correctly set based on price (not source)
    // price is already destructured from req.body above
    const downloadData = {
      ...req.body,
      tenantId: req.tenantId, // Add tenantId from middleware
      price: price,
      isFree: price === 0, // Always set isFree based on price, not source
      downloadCount: 1, // First download
      id: Date.now().toString() // Generate unique ID
    };

    console.log("📝 New download data:", downloadData);

    const newDownload = new Download(downloadData);
    await newDownload.save();

    console.log("✅ New download record created:", newDownload._id);

    res.status(201).json({
      success: true,
      message: "Download created successfully",
      data: newDownload,
      isUpdate: false
    });
  } catch (err) {
    console.error("Error creating download:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE DOWNLOAD
export const updateDownload = async (req, res) => {
  try {
    const updated = await Download.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Download not found" });
    }

    res.status(200).json({
      success: true,
      message: "Download updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating download:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE DOWNLOAD ACCESS (Toggle notDownloaded status)
export const updateDownloadAccess = async (req, res) => {
  try {
    const { notDownloaded } = req.body;

    const updated = await Download.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { notDownloaded: notDownloaded },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Download not found" });
    }

    res.status(200).json({
      success: true,
      message: `Download access ${notDownloaded ? 'revoked' : 'granted'} successfully`,
      data: updated
    });
  } catch (err) {
    console.error("Error updating download access:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE DOWNLOAD (Keep for complete removal if needed)
export const deleteDownload = async (req, res) => {
  try {
    const deleted = await Download.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Download not found" });
    }

    res.status(200).json({
      success: true,
      message: "Download deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting download:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
