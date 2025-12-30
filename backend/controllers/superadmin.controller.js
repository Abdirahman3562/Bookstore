import Admin from "../models/admin.model.js";
import Tenant from "../models/tenant.model.js";
import Subscription from "../models/subscription.model.js";
import Payment from "../models/payment.model.js";
import User from "../models/users.model.js";
import Book from "../models/books.model.js";
import Purchased from "../models/purchased.model.js";
import Download from "../models/downloads.model.js";
import bcrypt from "bcryptjs";

/**
 * Get Super Admin Dashboard Stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Overall stats
    const [
      totalTenants,
      activeTenants,
      expiredTenants,
      suspendedTenants,
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      totalUsers,
      totalBooks,
      totalAdmins,
      totalPurchases,
      totalDownloads
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: 'active' }),
      Tenant.countDocuments({ status: 'expired' }),
      Tenant.countDocuments({ status: 'suspended' }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Subscription.countDocuments({ status: 'expired' }),
      User.countDocuments(),
      Book.countDocuments(),
      Admin.countDocuments({ adminRole: { $ne: 'SUPER_ADMIN' } }),
      Purchased.countDocuments(),
      Download.countDocuments()
    ]);

    // Recent tenants
    const recentTenants = await Tenant.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name contactEmail status createdAt');

    // Expiring subscriptions (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lte: sevenDaysFromNow, $gte: new Date() }
    })
      .populate('tenantId', 'name contactEmail')
      .sort({ endDate: 1 })
      .limit(5);

    // Revenue calculation based on actual payments received
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Calculate monthly revenue from completed subscription and renewal payments
    const monthlyPayments = await Payment.find({
      status: 'completed',
      type: { $in: ['subscription', 'renewal'] }, // Count subscription and renewal payments
      paymentDate: {
        $gte: currentMonth,
        $lt: nextMonth
      }
    });

    // Calculate total revenue (payments minus refunds)
    let monthlyRevenue = 0;
    let totalRevenue = 0;
    let refundsThisMonth = 0;

    for (const payment of monthlyPayments) {
      if (payment.type === 'refund') {
        monthlyRevenue -= payment.amount;
        refundsThisMonth += payment.amount;
      } else {
        monthlyRevenue += payment.amount;
      }
    }

    // Calculate all-time revenue from subscription and renewal payments
    const allPayments = await Payment.find({
      status: 'completed',
      type: { $in: ['subscription', 'renewal'] } // Count subscription and renewal payments
    });
    for (const payment of allPayments) {
      if (payment.type === 'refund') {
        totalRevenue -= payment.amount;
      } else {
        totalRevenue += payment.amount;
      }
    }

    // Additional revenue metrics
    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthPayments = await Payment.find({
      status: 'completed',
      type: { $in: ['subscription', 'renewal'] }, // Count subscription and renewal payments
      paymentDate: {
        $gte: lastMonth,
        $lt: currentMonth
      }
    });

    let lastMonthRevenue = 0;
    for (const payment of lastMonthPayments) {
      if (payment.type === 'refund') {
        lastMonthRevenue -= payment.amount;
      } else {
        lastMonthRevenue += payment.amount;
      }
    }

    // Calculate revenue growth
    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
      : (monthlyRevenue > 0 ? 100 : 0);

    // Count active paid subscriptions
    const paidSubscriptions = await Subscription.countDocuments({
      status: 'active',
      price: { $gt: 0 }
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          tenants: {
            total: totalTenants,
            active: activeTenants,
            expired: expiredTenants,
            suspended: suspendedTenants
          },
          subscriptions: {
            total: totalSubscriptions,
            active: activeSubscriptions,
            expired: expiredSubscriptions
          },
          platform: {
            users: totalUsers,
            books: totalBooks,
            admins: totalAdmins,
            purchases: totalPurchases,
            downloads: totalDownloads
          },
          revenue: {
            monthly: monthlyRevenue,
            lastMonth: lastMonthRevenue,
            total: totalRevenue,
            growth: Math.round(revenueGrowth * 100) / 100, // Percentage growth
            refundsThisMonth: refundsThisMonth,
            paidSubscriptions: paidSubscriptions
          }
        },
        recentTenants,
        expiringSubscriptions
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message
    });
  }
};

/**
 * Create Admin (SUPER_ADMIN or regular ADMIN)
 * SUPER_ADMIN can create both SUPER_ADMIN and regular admins
 */
export const createAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      adminRole = 'admin',
      tenantId = null,
      permissions = {}
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Validate adminRole
    const validRoles = ['SUPER_ADMIN', 'admin', 'author'];
    if (!validRoles.includes(adminRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid admin role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // SUPER_ADMIN must have tenantId = null
    if (adminRole === 'SUPER_ADMIN' && tenantId) {
      return res.status(400).json({
        success: false,
        message: "SUPER_ADMIN cannot be assigned to a tenant"
      });
    }

    // Regular admins must have tenantId
    if (adminRole !== 'SUPER_ADMIN' && !tenantId) {
      return res.status(400).json({
        success: false,
        message: "Regular admins must be assigned to a tenant"
      });
    }

    // Check if email already exists (comprehensive check)
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      if (adminRole === 'SUPER_ADMIN' && existingAdmin.adminRole === 'SUPER_ADMIN') {
        return res.status(400).json({
          success: false,
          message: "Super Admin with this email already exists"
        });
      } else if (adminRole !== 'SUPER_ADMIN' && existingAdmin.adminRole !== 'SUPER_ADMIN') {
        // Check if it's the same tenant
        if (existingAdmin.tenantId?.toString() === tenantId?.toString()) {
          return res.status(400).json({
            success: false,
            message: "Admin with this email already exists in this tenant"
          });
        }
      } else {
        // Cross-role conflict (e.g., trying to create SUPER_ADMIN with email that exists as regular admin)
        return res.status(400).json({
          success: false,
          message: `Email already exists as ${existingAdmin.adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}. Cannot create ${adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} with same email.`
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      adminRole,
      tenantId: adminRole === 'SUPER_ADMIN' ? null : tenantId,
      permissions: permissions || {}
    });

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: `${adminRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} created successfully`,
      data: adminResponse
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      message: "Error creating admin",
      error: error.message
    });
  }
};

/**
 * Get all admins (SUPER_ADMIN can see all, regular admins see only their tenant)
 */
export const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, tenantId, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (role) query.adminRole = role;
    if (tenantId) query.tenantId = tenantId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const admins = await Admin.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Admin.countDocuments(query);

    res.status(200).json({
      success: true,
      data: admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admins",
      error: error.message
    });
  }
};
