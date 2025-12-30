import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "./models/admin.model.js";
import { connectDB } from "./config/db.js";

dotenv.config();

/**
 * Script to create the first SUPER_ADMIN user
 * Usage: node create-super-admin.js
 */
const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Get credentials from command line arguments or use defaults
    const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || "superadmin@bookstore.com";
    const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
    const name = process.argv[4] || process.env.SUPER_ADMIN_NAME || "Super Admin";

    console.log("🔐 Creating SUPER_ADMIN user...");
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);

    // Check if SUPER_ADMIN already exists
    const existingSuperAdmin = await Admin.findOne({ adminRole: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      console.log("⚠️  SUPER_ADMIN already exists!");
      console.log(`Existing SUPER_ADMIN email: ${existingSuperAdmin.email}`);
      console.log("To create a new one, delete the existing one first or use a different email.");
      process.exit(0);
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${email} already exists!`);
      console.log("Please use a different email.");
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create SUPER_ADMIN
    // Note: tenantId is null for SUPER_ADMIN (platform owner)
    const superAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      adminRole: 'SUPER_ADMIN',
      tenantId: null, // SUPER_ADMIN has no tenant
      permissions: {} // SUPER_ADMIN has all permissions by default
    });

    console.log("✅ SUPER_ADMIN created successfully!");
    console.log(`ID: ${superAdmin._id}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Role: ${superAdmin.adminRole}`);
    console.log("\n📝 Login credentials:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("\n⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating SUPER_ADMIN:", error);
    process.exit(1);
  }
};

createSuperAdmin();




