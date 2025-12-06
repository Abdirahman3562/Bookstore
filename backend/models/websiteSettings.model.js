import mongoose from "mongoose";

const websiteSettingsSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      default: "Bookstore",
      required: true,
    },
    websiteLogo: {
      type: String, // URL or path to logo image
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
websiteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const WebsiteSettings = mongoose.model("WebsiteSettings", websiteSettingsSchema);

export default WebsiteSettings;


