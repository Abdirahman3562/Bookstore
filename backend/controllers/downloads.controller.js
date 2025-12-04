import Download from "../models/downloads.model.js";

// GET ALL DOWNLOADS
export const getAllDownloads = async (req, res) => {
  try {
    const downloads = await Download.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Downloads fetched successfully",
      data: downloads,
      count: downloads.length
    });
  } catch (err) {
    console.error("Error fetching downloads:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE DOWNLOAD
export const getDownloadById = async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);
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

// CREATE NEW DOWNLOAD
export const createDownload = async (req, res) => {
  try {
    const downloadData = {
      ...req.body,
      id: Date.now().toString() // Generate unique ID
    };

    const newDownload = new Download(downloadData);
    await newDownload.save();

    res.status(201).json({
      success: true,
      message: "Download created successfully",
      data: newDownload
    });
  } catch (err) {
    console.error("Error creating download:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE DOWNLOAD
export const updateDownload = async (req, res) => {
  try {
    const updated = await Download.findByIdAndUpdate(
      req.params.id,
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

    const updated = await Download.findByIdAndUpdate(
      req.params.id,
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
    const deleted = await Download.findByIdAndDelete(req.params.id);

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
