import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "./models/tenant.model.js";

dotenv.config();

const createTenant = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    console.log("🔐 Creating default tenant for localhost development...");

    // Check if a localhost tenant already exists
    const existingTenant = await Tenant.findOne({ domain: 'localhost' });
    if (existingTenant) {
      console.log("⚠️  Localhost tenant already exists!");
      console.log(`Existing tenant: ${existingTenant.name} (${existingTenant._id})`);
      console.log(`Status: ${existingTenant.status}`);
      process.exit(0);
    }

    // Check all existing tenants
    const allTenants = await Tenant.find({});
    console.log(`Found ${allTenants.length} existing tenants:`);
    allTenants.forEach((t, i) => {
      console.log(`${i+1}. ${t.name} - Domain: ${t.domain}, Subdomain: ${t.subdomain}, Status: ${t.status}, ID: ${t._id}`);
    });

    // Create a default tenant for localhost development
    const tenant = await Tenant.create({
      name: "Local Development",
      domain: "localhost",
      subdomain: "dev",
      status: "active",
      contactEmail: "admin@localhost.dev",
      contactName: "Local Admin",
      contactPhone: "",
      settings: {
        theme: "default",
        currency: "USD",
        language: "en"
      }
    });

    console.log("✅ Localhost tenant created successfully!");
    console.log(`ID: ${tenant._id}`);
    console.log(`Name: ${tenant.name}`);
    console.log(`Domain: ${tenant.domain}`);
    console.log(`Status: ${tenant.status}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating tenant:", error);
    process.exit(1);
  }
};

createTenant();
