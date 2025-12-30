// Simple script to check plans in MongoDB using existing backend setup
import { MongoClient } from 'mongodb';

async function checkPlans() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    console.log('🔍 Checking plans in database...\n');

    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('bookstore');
    const plans = await db.collection('plans').find({}).sort({ createdAt: 1 }).toArray();

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
        console.log(`   Created: ${new Date(plan.createdAt).toLocaleString()}`);
        console.log(`   Updated: ${new Date(plan.updatedAt).toLocaleString()}`);
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
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkPlans();
