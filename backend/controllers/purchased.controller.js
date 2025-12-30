import Purchased from "../models/purchased.model.js";
import User from "../models/users.model.js";
import Notification from "../models/notifications.model.js";
import { sendOrderActiveEmail } from "../utils/email.js";

// GET ALL PURCHASED ITEMS
export const getAllPurchased = async (req, res) => {
  try {
    const purchased = await Purchased.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    
    // Fetch user avatars for each purchased item
    const purchasedWithAvatars = await Promise.all(
      purchased.map(async (item) => {
        try {
          const user = await User.findOne({ email: item.email });
          const itemObj = item.toObject();
          if (user && user.avatar) {
            itemObj.userAvatar = user.avatar;
          }
          return itemObj;
        } catch (error) {
          // If user not found or error, return item without avatar
          return item.toObject();
        }
      })
    );
    
    res.status(200).json({
      success: true,
      message: "Purchased items fetched successfully",
      data: purchasedWithAvatars,
      count: purchasedWithAvatars.length
    });
  } catch (err) {
    console.error("Error fetching purchased items:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE PURCHASED ITEM
export const getPurchasedById = async (req, res) => {
  try {
    const purchased = await Purchased.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!purchased) {
      return res.status(404).json({ success: false, message: "Purchased item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Purchased item fetched successfully",
      data: purchased
    });
  } catch (err) {
    console.error("Error fetching purchased item:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE NEW PURCHASED ITEM
export const createPurchased = async (req, res) => {
  try {
    const purchasedData = {
      ...req.body,
      tenantId: req.tenantId, // Add tenantId from middleware
      id: Date.now().toString() // Generate unique ID
    };

    const newPurchased = new Purchased(purchasedData);
    await newPurchased.save();

    res.status(201).json({
      success: true,
      message: "Purchased item created successfully",
      data: newPurchased
    });
  } catch (err) {
    console.error("Error creating purchased item:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PURCHASED ITEM
export const updatePurchased = async (req, res) => {
  try {
    const updated = await Purchased.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Purchased item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Purchased item updated successfully",
      data: updated
    });
  } catch (err) {
    console.error("Error updating purchased item:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Updating order ${id} status to: ${status}`);

    if (!['pending', 'approved', 'cancelled', 'active'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: pending, approved, cancelled, or active"
      });
    }

    // First, find the current order to log the change
    const currentOrder = await Purchased.findOne({ _id: id, tenantId: req.tenantId });
    if (!currentOrder) {
      return res.status(404).json({ success: false, message: "Purchased item not found" });
    }

    console.log(`📝 Current status: ${currentOrder.status} → New status: ${status}`);

    const updated = await Purchased.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Failed to update purchased item" });
    }

    console.log(`✅ Successfully updated order ${id} status to: ${updated.status}`);

    // If status is changed to "active", send email and create notification
    if (status === 'active' && currentOrder.status !== 'active') {
      try {
        // Send email notification
        await sendOrderActiveEmail(
          updated.email,
          updated.userName,
          updated.title,
          updated.author,
          updated.pdfUrl
        );
        console.log(`📧 Order active email sent to ${updated.email}`);

        // Create notification for user
        const notification = new Notification({
          userId: updated.userId,
          type: 'order_active',
          title: 'Book Approved & Ready to Download! 🎉',
          message: `Your book "${updated.title}" by ${updated.author} is now active and ready to download.`,
          relatedId: updated._id.toString(),
          relatedType: 'purchase'
        });
        await notification.save();
        console.log(`🔔 Notification created for user ${updated.userId}`);
      } catch (error) {
        console.error("❌ Error sending email/notification:", error);
        // Don't fail the request if email/notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// DELETE PURCHASED ITEM
export const deletePurchased = async (req, res) => {
  try {
    const deleted = await Purchased.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Purchased item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Purchased item deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting purchased item:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
