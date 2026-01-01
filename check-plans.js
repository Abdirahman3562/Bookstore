import mongoose from 'mongoose';

// Define Plan schema (same as in the app)
const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  billingCycle: { type: String, required: true },
  limits: {
    users: { type: Number, default: -1 },
    books: { type: Number, default: -1 },
    storage: { type: Number, default: -1 },
    bandwidth: { type: Number, default: -1 }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Plan = mongoose.model('Plan', planSchema);

async function checkPlans() {
  try {
    console.log('🔍 Checking plans in database...\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bookstore');
    console.log('✅ Connected to MongoDB\n');

    // Get all plans
    const plans = await Plan.find({}).sort({ createdAt: 1 });

    console.log(`📊 Total plans found: ${plans.length}\n`);

    if (plans.length === 0) {
      console.log('❌ No plans found in database');
      console.log('💡 You can add plans through the Plan Management page in the admin panel');
    } else {
      console.log('📋 Plans in database:\n');
      console.log('─'.repeat(80));

      plans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.name}`);
        console.log(`   Key: ${plan.key}`);
        console.log(`   Price: $${plan.price} ${plan.currency}`);
        console.log(`   Billing Cycle: ${plan.billingCycle}`);
        console.log(`   Status: ${plan.isActive ? 'Active' : 'Inactive'}`);
        console.log(`   Limits:`);
        console.log(`     - Users: ${plan.limits.users === -1 ? 'Unlimited' : plan.limits.users}`);
        console.log(`     - Books: ${plan.limits.books === -1 ? 'Unlimited' : plan.limits.books}`);
        console.log(`     - Storage: ${plan.limits.storage === -1 ? 'Unlimited' : `${plan.limits.storage / (1024 * 1024 * 1024)} GB`}`);
        console.log(`     - Bandwidth: ${plan.limits.bandwidth === -1 ? 'Unlimited' : `${plan.limits.bandwidth / (1024 * 1024 * 1024)} GB`}`);
        console.log(`   Created: ${plan.createdAt.toLocaleString()}`);
        console.log(`   Updated: ${plan.updatedAt.toLocaleString()}`);
        console.log('─'.repeat(80));
      });

      // Summary
      const activePlans = plans.filter(p => p.isActive).length;
      const inactivePlans = plans.filter(p => !p.isActive).length;

      console.log(`\n📈 Summary:`);
      console.log(`   Active plans: ${activePlans}`);
      console.log(`   Inactive plans: ${inactivePlans}`);
    }

  } catch (error) {
    console.error('❌ Error checking plans:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkPlans();




