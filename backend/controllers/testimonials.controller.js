import Testimonial from "../models/testimonials.model.js";

// GET ALL TESTIMONIALS
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Testimonials fetched successfully",
      data: testimonials,
      count: testimonials.length
    });
  } catch (err) {
    console.error("Error fetching testimonials:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE TESTIMONIAL
export const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Testimonial fetched successfully",
      data: testimonial
    });
  } catch (err) {
    console.error("Error fetching testimonial:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE NEW TESTIMONIAL
export const createTestimonial = async (req, res) => {
  try {
    const testimonialData = {
      ...req.body,
      id: Date.now().toString() // Generate unique ID
    };

    // Handle file upload
    if (req.file) {
      testimonialData.img = `/uploads/${req.file.filename}`;
    }

    const newTestimonial = new Testimonial(testimonialData);
    await newTestimonial.save();

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: newTestimonial
    });
  } catch (err) {
    console.error("Error creating testimonial:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE TESTIMONIAL
export const updateTestimonial = async (req, res) => {
  try {
    const testimonialData = { ...req.body };

    // Handle file upload
    if (req.file) {
      testimonialData.img = `/uploads/${req.file.filename}`;
    }

    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      testimonialData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Testimonial updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating testimonial:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE TESTIMONIAL STATUS (Approve/Reject)
export const updateTestimonialStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: pending, approved, or rejected"
      });
    }

    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({
      success: true,
      message: `Testimonial ${status} successfully`,
      data: updated
    });
  } catch (err) {
    console.error("Error updating testimonial status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE TESTIMONIAL
export const deleteTestimonial = async (req, res) => {
  try {
    const deleted = await Testimonial.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting testimonial:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
