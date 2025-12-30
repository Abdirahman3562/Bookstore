import mongoose from "mongoose";

const websiteSettingsSchema = new mongoose.Schema(
  {
    // Multi-tenant support: each tenant has their own website settings
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true
    },
    websiteName: {
      type: String,
      default: "Bookstore",
      required: true,
    },
    websiteLogo: {
      type: String, // URL or path to logo image
      default: "",
    },
    supportEmail: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Get settings for a specific tenant
websiteSettingsSchema.statics.getSettings = async function (tenantId) {
  let settings = await this.findOne({ tenantId });
  if (!settings) {
    settings = await this.create({ tenantId });
  }
  return settings;
};

const WebsiteSettings = mongoose.model("WebsiteSettings", websiteSettingsSchema);

export default WebsiteSettings;



