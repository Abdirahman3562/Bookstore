import mongoose from 'mongoose';
import Plan from './models/plans.model.js';

async function initPlans() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bookstore');
    console.log('Connected to MongoDB');

    const defaultPlans = [
      { name: 'Free Plan', key: 'free', price: 0, currency: 'USD', billingCycle: 'monthly', limits: { users: 5, books: 10, storage: 1073741824, bandwidth: 1073741824 } },
      { name: 'Monthly Plan', key: 'monthly', price: 9.99, currency: 'USD', billingCycle: 'monthly', limits: { users: -1, books: -1, storage: -1, bandwidth: -1 } },
      { name: 'Yearly Plan', key: 'yearly', price: 99.99, currency: 'USD', billingCycle: 'yearly', limits: { users: -1, books: -1, storage: -1, bandwidth: -1 } },
      { name: 'Lifetime Plan', key: 'lifetime', price: 299.99, currency: 'USD', billingCycle: 'lifetime', limits: { users: -1, books: -1, storage: -1, bandwidth: -1 } }
    ];

    for (const planData of defaultPlans) {
      const existingPlan = await Plan.findOne({ key: planData.key });
      if (!existingPlan) {
        const plan = new Plan(planData);
        await plan.save();
        console.log('Created plan:', planData.name);
      } else {
        console.log('Plan already exists:', planData.name);
      }
    }

    console.log('Default plans initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing plans:', error);
    process.exit(1);
  }
}

initPlans();
