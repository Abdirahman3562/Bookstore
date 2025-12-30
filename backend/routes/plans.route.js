import express from 'express';
import { getAllPlans, getPlanByKey, createPlan, updatePlan, deletePlan, initializeDefaultPlans } from '../controllers/plans.controller.js';
import { requireSuperAdmin } from '../middleware/tenant.middleware.js';

const router = express.Router();

// All routes require super admin authentication
router.use(requireSuperAdmin);

// Routes
router.get('/', getAllPlans);
router.get('/:key', getPlanByKey);
router.post('/', createPlan);
router.put('/:key', updatePlan);
router.delete('/:key', deletePlan);

// Initialize default plans (one-time setup)
router.post('/initialize', initializeDefaultPlans);

export default router;
