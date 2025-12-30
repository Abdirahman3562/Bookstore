import Plan from '../models/plans.model.js';

// Get all plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ createdAt: 1 });

    // Convert to object format expected by frontend
    const plansObject = {};
    plans.forEach(plan => {
      plansObject[plan.key] = {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        limits: plan.limits
      };
    });

    res.status(200).json({
      success: true,
      data: plansObject
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans'
    });
  }
};

// Get plan by key
export const getPlanByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const plan = await Plan.findOne({ key, isActive: true });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan'
    });
  }
};

// Create new plan
export const createPlan = async (req, res) => {
  try {
    const { name, key, price, currency, billingCycle, limits } = req.body;

    // Check if plan key already exists
    const existingPlan = await Plan.findOne({ key });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan key already exists'
      });
    }

    const newPlan = new Plan({
      name,
      key,
      price,
      currency,
      billingCycle,
      limits: limits || {
        users: -1,
        books: -1,
        storage: -1,
        bandwidth: -1
      }
    });

    newPlan.updatedAt = new Date();
    await newPlan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: newPlan
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create plan'
    });
  }
};

// Update plan
export const updatePlan = async (req, res) => {
  try {
    const { key } = req.params;
    const updates = req.body;

    // Don't allow updating the key
    delete updates.key;

    const updatedPlan = await Plan.findOneAndUpdate(
      { key },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: updatedPlan
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan'
    });
  }
};

// Delete plan (hard delete)
export const deletePlan = async (req, res) => {
  try {
    const { key } = req.params;

    const deletedPlan = await Plan.findOneAndDelete({ key });

    if (!deletedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plan'
    });
  }
};

// Initialize default plans (run this once)
export const initializeDefaultPlans = async (req, res) => {
  try {
    const defaultPlans = [
      {
        name: "Free Plan",
        key: "free",
        price: 0,
        currency: "USD",
        billingCycle: "monthly",
        limits: { users: 5, books: 10, storage: 1073741824, bandwidth: 1073741824 }
      },
      {
        name: "Monthly Plan",
        key: "monthly",
        price: 9.99,
        currency: "USD",
        billingCycle: "monthly",
        limits: { users: -1, books: -1, storage: -1, bandwidth: -1 }
      },
      {
        name: "Yearly Plan",
        key: "yearly",
        price: 99.99,
        currency: "USD",
        billingCycle: "yearly",
        limits: { users: -1, books: -1, storage: -1, bandwidth: -1 }
      },
      {
        name: "Lifetime Plan",
        key: "lifetime",
        price: 299.99,
        currency: "USD",
        billingCycle: "lifetime",
        limits: { users: -1, books: -1, storage: -1, bandwidth: -1 }
      }
    ];

    for (const planData of defaultPlans) {
      const existingPlan = await Plan.findOne({ key: planData.key });
      if (!existingPlan) {
        const plan = new Plan(planData);
        await plan.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Default plans initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing default plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize default plans'
    });
  }
};
