import Purchased from "../models/purchased.model.js";
import User from "../models/users.model.js";
import Notification from "../models/notifications.model.js";
import Admin from "../models/admin.model.js";
import Book from "../models/books.model.js";
import { sendOrderActiveEmail } from "../utils/email.js";

// GET ALL PURCHASED ITEMS
export const getAllPurchased = async (req, res) => {
  try {
    const purchased = await Purchased.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    
    // Fetch user avatars for each purchased item
    const purchasedWithAvatars = await Promise.all(
      purchased.map(async (item) => {
        try {
          const user = await User.findOne({ email: item.email, tenantId: req.tenantId });
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
    // TEMPORARILY ADD DUMMY TENANT ID FOR TESTING
    // Find first tenant or create dummy ObjectId
    let tenantId = req.tenantId;
    if (!tenantId) {
      try {
        const Tenant = (await import("../models/tenant.model.js")).default;
        const firstTenant = await Tenant.findOne({});
        tenantId = firstTenant ? firstTenant._id : "507f1f77bcf86cd799439011"; // Dummy ObjectId
      } catch (err) {
        tenantId = "507f1f77bcf86cd799439011"; // Dummy ObjectId for testing
      }
    }

    const purchasedData = {
      ...req.body,
      tenantId: tenantId,
      id: Date.now().toString() // Generate unique ID
    };

    const newPurchased = new Purchased(purchasedData);
    await newPurchased.save();

    // Create notification for ALL ADMINS about the new order
    try {
      console.log("📧 Creating admin notification for new order:", newPurchased._id);

      // Find all admins in the same tenant
      const admins = await Admin.find({ tenantId: req.tenantId });
      console.log(`📧 Found ${admins.length} admins in tenant`);

      // Create notification for each admin
      for (const admin of admins) {
        const adminNotificationData = {
          tenantId: req.tenantId,
          userId: admin._id.toString(),
          receiverRole: 'admin',
          type: 'new_order',
          title: 'New Order Received! 📦',
          message: `${purchasedData.userName} placed an order for "${purchasedData.title}" by ${purchasedData.author}. Status: ${purchasedData.status}`,
          relatedId: newPurchased._id.toString(),
          relatedType: 'purchase'
        };

        await Notification.create(adminNotificationData);
        console.log(`✅ Admin notification created for ${admin.name}`);
      }
    } catch (adminNotificationError) {
      console.error("❌ Error creating admin notifications:", adminNotificationError);
      // Don't fail the purchase if admin notifications fail
    }

    // Create notification for the admin who uploaded the purchased book
    try {
      console.log("📧 Creating notification for purchase:", newPurchased._id);
      console.log("📧 Book ID:", purchasedData.bookId);
      console.log("📧 Book title:", purchasedData.title);

      let targetAdmin = null;

      // Find the book to get the admin who uploaded it
      const book = await Book.findOne({ _id: purchasedData.bookId }).catch(err => {
        console.log("⚠️ Error finding book:", err.message);
        return null;
      });

      if (book && book.uploadedBy) {
        console.log("📧 Book uploaded by admin:", book.uploadedBy);

        // Find the admin who uploaded the book
        const bookAdmin = await Admin.findById(book.uploadedBy).catch(err => {
          console.log("⚠️ Error finding admin:", err.message);
          return null;
        });

        if (bookAdmin) {
          targetAdmin = bookAdmin;
          console.log("📧 Found book admin:", bookAdmin.name, bookAdmin.email);
        } else {
          console.log("⚠️ Admin who uploaded the book not found");
        }
      } else {
        console.log("⚠️ Book not found or no uploadedBy field");
      }

      // If no specific admin found, try to find any admin with "author" role or just any admin
      if (!targetAdmin) {
        console.log("🔍 Looking for fallback admin...");

        // First try to find admins with "author" role
        const authorAdmins = await Admin.find({ adminRole: "author" }).catch(err => {
          console.log("⚠️ Error finding author admins:", err.message);
          return [];
        });

        if (authorAdmins.length > 0) {
          targetAdmin = authorAdmins[0]; // Use first author admin
          console.log("📧 Using author admin:", targetAdmin.name);
        } else {
          // If no author admins, find any admin
          const anyAdmin = await Admin.findOne({}).catch(err => {
            console.log("⚠️ Error finding any admin:", err.message);
            return null;
          });

          if (anyAdmin) {
            targetAdmin = anyAdmin;
            console.log("📧 Using any admin:", targetAdmin.name);
          } else {
            console.log("❌ No admins found in database - skipping notification");
            return;
          }
        }
      }

      // Create notification for the target admin
      const userInfo = purchasedData.userName
        ? `${purchasedData.userName} (${purchasedData.email})`
        : purchasedData.email || "A user";

      const notificationData = {
        userId: targetAdmin._id.toString(),
        type: "order_approved",
        title: "New Book Purchase",
        message: `${userInfo} purchased ${book ? 'your book' : 'a book'} "${purchasedData.title || "a book"}"`,
        relatedId: newPurchased._id.toString(),
        relatedType: "purchase"
      };

      console.log("📧 Creating notification for admin:", {
        adminId: targetAdmin._id,
        adminName: targetAdmin.name,
        adminEmail: targetAdmin.email,
        userInfo: userInfo,
        bookTitle: purchasedData.title,
        purchaseId: newPurchased._id
      });

      const createdNotification = await Notification.create(notificationData);
      console.log("✅ Successfully created notification:", {
        notificationId: createdNotification._id,
        title: createdNotification.title,
        message: createdNotification.message,
        userId: createdNotification.userId,
        type: createdNotification.type,
        createdAt: createdNotification.createdAt
      });

    } catch (notificationError) {
      console.error("❌ Error creating purchase notification:", notificationError);
      console.error("❌ Error details:", notificationError.message);
      // Don't fail the purchase if notifications fail
    }

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

    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // If status is being set to approved, also set isDownloadAllowed to true
    if (status === 'approved') {
      updateData.isDownloadAllowed = true;
    }

    const updated = await Purchased.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Purchased item not found" });
    }

    console.log(`✅ Successfully updated order ${id} status to: ${updated.status}, download allowed: ${updated.isDownloadAllowed}`);

    // If status is changed to "approved", create notification for user
    if (status === 'approved' && currentOrder.status !== 'approved') {
      try {
        console.log(`🔔 Creating approval notification for user ${updated.userId}`);
        console.log(`👤 User details:`, {
          userId: updated.userId,
          userName: updated.userName,
          email: updated.email
        });

        // Create notification for user
        const notification = new Notification({
          tenantId: req.tenantId,
          userId: updated.userId.toString(),
          receiverRole: 'user',
          type: 'order_approved',
          title: 'Order Approved! ✅',
          message: `Your order for "${updated.title}" by ${updated.author} has been approved. You can now download your book.`,
          relatedId: updated._id.toString(),
          relatedType: 'purchase'
        });
        await Notification.create(notification);
        console.log(`✅ Approval notification created for user ${updated.userId}`);
        console.log(`📋 Notification saved:`, {
          id: notification._id,
          userId: notification.userId,
          title: notification.title,
          type: notification.type
        });
      } catch (notificationError) {
        console.error("❌ Error creating approval notification:", notificationError);
        // Don't fail the status update if notification creation fails
      }
    }

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
