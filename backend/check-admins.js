import { connectDB } from './config/db.js';
import Admin from './models/admin.model.js';

async function checkAdmins() {
  try {
    await connectDB();
    console.log('👥 Checking admin users...\n');

    const admins = await Admin.find({}).select('name email adminRole tenantId');

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} - ${admin.email}`);
      console.log(`   Role: ${admin.adminRole}`);
      console.log(`   Tenant: ${admin.tenantId || 'SUPER_ADMIN (no tenant)'}`);
      console.log('   ──────────────────────────────────');
    });

    console.log(`\n📊 Total admins: ${admins.length}`);

  } catch (error) {
    console.error('❌ Error checking admins:', error);
  } finally {
    process.exit(0);
  }
}

checkAdmins();

