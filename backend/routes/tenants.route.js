import express from "express";
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  createTenantAdmin,
  getTenantAdmins
} from "../controllers/tenants.controller.js";
import { requireSuperAdmin } from "../middleware/tenant.middleware.js";

const router = express.Router();

// All routes require SUPER_ADMIN
router.use(requireSuperAdmin);

// Tenant management routes
router.get("/", getAllTenants);
router.get("/:id", getTenantById);
router.post("/", createTenant);
router.put("/:id", updateTenant);
router.put("/:id/suspend", suspendTenant);
router.put("/:id/activate", activateTenant);
router.delete("/:id", deleteTenant);

// Tenant admin management
router.post("/:tenantId/admins", createTenantAdmin);
router.get("/:tenantId/admins", getTenantAdmins);

export default router;




