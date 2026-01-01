import Contact from "../models/contact.model.js";
import User from "../models/users.model.js";
import { transporter } from "../utils/email.js";
import WebsiteSettings from "../models/websiteSettings.model.js";

// CREATE NEW CONTACT MESSAGE
export const createContact = async (req, res) => {
  try {
    const { userId, name, email, message } = req.body;

    // Validate required fields
    if (!userId || !name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (userId, name, email, message)"
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please login first."
      });
    }

    // Validate message length
    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 500 characters"
      });
    }

    // Create contact message with user avatar
    const contact = await Contact.create({
      tenantId: req.tenantId, // Add tenantId from middleware
      userId,
      name,
      email,
      userAvatar: user.avatar || "",
      message
    });

    // Send email notification to admin
    let emailSent = false;
    let emailError = null;

    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error("❌ Email credentials not configured. Cannot send contact notification.");
        emailError = "Email service not configured";
      } else {
        // Get website settings for the current tenant
        const websiteSettings = await WebsiteSettings.getSettings(req.tenantId);
        const adminEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
        const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
        const fromName = websiteSettings.websiteName || "Bookstore";
        const fromField = `${fromName} <${fromEmail}>`;

        // Format the message date
        const messageDate = new Date(contact.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Create email content
        const mailOptions = {
          from: fromField,
          to: adminEmail,
          subject: `New Contact Message from ${name} - ${websiteSettings.websiteName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                  New Contact Message
                </h2>
                
                <div style="margin: 20px 0;">
                  <p style="font-size: 16px; color: #333; margin: 10px 0;">
                    <strong>From:</strong> ${name}
                  </p>
                  <p style="font-size: 16px; color: #333; margin: 10px 0;">
                    <strong>Email:</strong> <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                  </p>
                  <p style="font-size: 16px; color: #333; margin: 10px 0;">
                    <strong>Date:</strong> ${messageDate}
                  </p>
                </div>

                <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                  <h3 style="color: #333; margin-top: 0;">Message:</h3>
                  <p style="font-size: 16px; color: #555; line-height: 1.6; white-space: pre-wrap; margin: 0;">
                    ${message.replace(/\n/g, '<br>')}
                  </p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="font-size: 12px; color: #666; margin: 5px 0;">
                    This message was sent through the contact form on ${websiteSettings.websiteName}.
                  </p>
                  <p style="font-size: 12px; color: #666; margin: 5px 0;">
                    User ID: ${userId}
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `
New Contact Message

From: ${name}
Email: ${email}
Date: ${messageDate}

Message:
${message}

---
This message was sent through the contact form on ${websiteSettings.websiteName}.
User ID: ${userId}
          `.trim()
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log(`✅ Contact notification email sent to admin: ${adminEmail}`);
      }
    } catch (emailErr) {
      console.error("❌ Error sending contact notification email:", emailErr);
      emailError = emailErr.message || "Failed to send notification email";
      // Don't fail the contact creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Contact message sent successfully",
      data: contact,
      emailSent: emailSent,
      emailError: emailError
    });
  } catch (err) {
    console.error("Error creating contact:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET ALL CONTACT MESSAGES (for admin)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ tenantId: req.tenantId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    // For contacts without userAvatar (old contacts), populate from user
    const contactsWithAvatars = contacts.map((contact) => {
      const contactObj = contact.toObject();
      // If contact doesn't have userAvatar but user has avatar, use it
      if (!contactObj.userAvatar && contact.userId && typeof contact.userId === 'object' && contact.userId.avatar) {
        contactObj.userAvatar = contact.userId.avatar;
        // Update the contact in database for future use (async, don't wait)
        Contact.findByIdAndUpdate(contact._id, {
          userAvatar: contact.userId.avatar
        }).catch(err => console.error('Error updating contact avatar:', err));
      }
      return contactObj;
    });

    res.status(200).json({
      success: true,
      message: "Contacts fetched successfully",
      data: contactsWithAvatars,
      count: contactsWithAvatars.length
    });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET CONTACT BY ID
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('userId', 'name email avatar');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    // If contact doesn't have userAvatar but user has avatar, use it
    let contactData = contact.toObject();
    if (!contactData.userAvatar && contact.userId && contact.userId.avatar) {
      contactData.userAvatar = contact.userId.avatar;
    }

    res.status(200).json({
      success: true,
      message: "Contact fetched successfully",
      data: contactData
    });
  } catch (err) {
    console.error("Error fetching contact:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// UPDATE CONTACT STATUS (for admin)
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (pending, read, or replied)"
      });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact status updated successfully",
      data: contact
    });
  } catch (err) {
    console.error("Error updating contact:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// DELETE CONTACT (for admin)
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// SEND REPLY EMAIL (for admin)
export const sendReplyEmail = async (req, res) => {
  try {
    const { contactId, replyMessage } = req.body;

    // Validate required fields
    if (!contactId || !replyMessage || !replyMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact ID and reply message are required"
      });
    }

    // Find the contact
    const contact = await Contact.findById(contactId).populate('userId', 'name email');
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Email service not configured. Please configure EMAIL_USER and EMAIL_PASSWORD in .env file"
      });
    }

    // Get website settings
    const websiteSettings = await WebsiteSettings.getSettings();
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const fromName = websiteSettings.websiteName || "Bookstore";
    const fromField = `${fromName} <${fromEmail}>`;

    // Format the original message date
    const originalDate = new Date(contact.createdAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create email content
    const mailOptions = {
      from: fromField,
      to: contact.email,
      subject: `Re: Your Contact Message - ${websiteSettings.websiteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
              Thank You for Contacting Us
            </h2>
            
            <p style="font-size: 16px; color: #333; margin: 20px 0;">
              Hello ${contact.name},
            </p>
            
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="font-size: 16px; color: #555; line-height: 1.6; white-space: pre-wrap; margin: 0;">
                ${replyMessage.replace(/\n/g, '<br>')}
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #666; margin: 10px 0;">
                <strong>Your original message:</strong>
              </p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p style="font-size: 14px; color: #555; margin: 5px 0;">
                  <strong>Date:</strong> ${originalDate}
                </p>
                <p style="font-size: 14px; color: #555; margin: 10px 0; white-space: pre-wrap;">
                  ${contact.message.replace(/\n/g, '<br>')}
                </p>
              </div>
            </div>

            <p style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              Best regards,<br>
              <strong>${websiteSettings.websiteName} Team</strong>
            </p>
          </div>
        </div>
      `,
      text: `
Thank You for Contacting Us

Hello ${contact.name},

${replyMessage}

---
Your original message:
Date: ${originalDate}
${contact.message}

Best regards,
${websiteSettings.websiteName} Team
      `.trim()
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reply email sent to: ${contact.email}`);

    // Update contact status to 'replied'
    await Contact.findByIdAndUpdate(contactId, { status: 'replied' });

    res.status(200).json({
      success: true,
      message: "Reply email sent successfully"
    });
  } catch (err) {
    console.error("Error sending reply email:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send reply email",
      error: err.message
    });
  }
};

