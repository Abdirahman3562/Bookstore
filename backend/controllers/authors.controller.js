import Author from "../models/authors.model.js";

// GET ALL AUTHORS
export const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Authors fetched successfully",
      data: authors,
      count: authors.length
    });
  } catch (err) {
    console.error("Error fetching authors:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE AUTHOR
export const getAuthorById = async (req, res) => {
  try {
    const author = await Author.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    res.status(200).json({
      success: true,
      message: "Author fetched successfully",
      data: author
    });
  } catch (err) {
    console.error("Error fetching author:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE NEW AUTHOR
export const createAuthor = async (req, res) => {
  try {
    const {
      username,
      name,
      avatar,
      verified,
      bio,
      location,
      website,
      email,
      social,
      status
    } = req.body;

    // Check if username already exists within this tenant
    const existingAuthor = await Author.findOne({ username: username.toLowerCase(), tenantId: req.tenantId });
    if (existingAuthor) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    // Check if email already exists within this tenant
    const existingEmail = await Author.findOne({ email: email.toLowerCase(), tenantId: req.tenantId });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const newAuthor = new Author({
      tenantId: req.tenantId, // Add tenantId from middleware
      username: username.toLowerCase(),
      name,
      avatar: avatar || "",
      verified: verified || false,
      bio: bio || "",
      location: location || "",
      website: website || "",
      email: email.toLowerCase(),
      social: {
        github: social?.github || "",
        linkedin: social?.linkedin || "",
        twitter: social?.twitter || "",
        youtube: social?.youtube || "",
        facebook: social?.facebook || "",
        instagram: social?.instagram || ""
      },
      status: status || 'active'
    });

    await newAuthor.save();

    res.status(201).json({
      success: true,
      message: "Author created successfully",
      data: newAuthor
    });
  } catch (err) {
    console.error("Error creating author:", err);
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

// UPDATE AUTHOR
export const updateAuthor = async (req, res) => {
  try {
    const {
      username,
      name,
      avatar,
      verified,
      bio,
      location,
      website,
      email,
      social,
      status
    } = req.body;

    const author = await Author.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    // Check if username is being changed and if it already exists within this tenant
    if (username && username.toLowerCase() !== author.username) {
      const existingAuthor = await Author.findOne({ username: username.toLowerCase(), tenantId: req.tenantId });
      if (existingAuthor) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
    }

    // Check if email is being changed and if it already exists within this tenant
    if (email && email.toLowerCase() !== author.email) {
      const existingEmail = await Author.findOne({ email: email.toLowerCase(), tenantId: req.tenantId });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
    }

    const updateData = {
      username: username ? username.toLowerCase() : author.username,
      name: name || author.name,
      verified: verified !== undefined ? verified : author.verified,
      bio: bio !== undefined ? bio : author.bio,
      location: location !== undefined ? location : author.location,
      website: website !== undefined ? website : author.website,
      email: email ? email.toLowerCase() : author.email,
      social: {
        github: social?.github !== undefined ? social.github : author.social?.github || "",
        linkedin: social?.linkedin !== undefined ? social.linkedin : author.social?.linkedin || "",
        twitter: social?.twitter !== undefined ? social.twitter : author.social?.twitter || "",
        youtube: social?.youtube !== undefined ? social.youtube : author.social?.youtube || "",
        facebook: social?.facebook !== undefined ? social.facebook : author.social?.facebook || "",
        instagram: social?.instagram !== undefined ? social.instagram : author.social?.instagram || ""
      },
      status: status || author.status
    };

    // Only update avatar if it's provided
    if (avatar !== undefined && avatar !== null && avatar !== "") {
      updateData.avatar = avatar;
    }

    const updated = await Author.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Author updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating author:", err);
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

// UPDATE AUTHOR STATUS
export const updateAuthorStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: active or inactive"
      });
    }

    const author = await Author.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!author) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    const updated = await Author.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status: status },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Author status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    console.error("Error updating author status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE AUTHOR
export const deleteAuthor = async (req, res) => {
  try {
    const deleted = await Author.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    res.status(200).json({
      success: true,
      message: "Author deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting author:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

