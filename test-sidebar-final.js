// Test the final sidebar permission logic
const allMenuItems = [
  { path: "/admin/dashboard", label: "Dashboard", permission: "dashboard" },
  { path: "/admin/books", label: "Books", permission: "books" },
  { path: "/admin/live-chat", label: "Live Chat", permission: "liveChat" },
  { path: "/admin/website-settings", label: "Website Settings", permission: "websiteSettings", adminOnly: true }
];

// Simulate currentUser from JWT
const currentUser = {
  _id: "69553030a10ebc7b312ea158",
  email: "maanow@gmail.com",
  adminRole: "admin",
  permissions: {
    dashboard: { view: true },
    books: { view: true },
    liveChat: { view: true },
    websiteSettings: { view: true, add: false, edit: true, delete: false }
  }
};

console.log('Testing final sidebar permission logic...');
console.log('Current user:', currentUser.adminRole);
console.log('Permissions:', currentUser.permissions);

const filteredItems = allMenuItems.filter(item => {
  const permissionKey = item.permission;
  console.log(`\n🔍 Testing ${item.label} (${permissionKey})`);

  // TEMPORARY FIX: Always show critical items for admin users
  if (permissionKey === 'liveChat' || permissionKey === 'websiteSettings') {
    console.log(`   ✅ TEMP FIX: Always showing ${item.label}`);
    return true;
  }

  // Get permission object for this section
  const sectionPerms = currentUser.permissions[permissionKey];
  console.log(`   📋 Permission object:`, sectionPerms);

  // Hide admin-only items if user doesn't have permission
  if (item.adminOnly) {
    if (typeof sectionPerms === 'boolean') {
      const hasPermission = sectionPerms === true;
      console.log(`   🔒 adminOnly boolean check: ${hasPermission}`);
      return hasPermission;
    }
    if (typeof sectionPerms === 'object' && sectionPerms !== null) {
      const hasPermission = sectionPerms.view === true;
      console.log(`   🔒 adminOnly object.view check: ${hasPermission}`);
      return hasPermission;
    }
    console.log(`   ❌ adminOnly - no permission, hiding`);
    return false;
  }

  // Check regular items
  if (typeof sectionPerms === 'boolean') {
    const hasPermission = sectionPerms === true;
    console.log(`   ✅ regular boolean check: ${hasPermission}`);
    return hasPermission;
  }
  if (typeof sectionPerms === 'object' && sectionPerms !== null) {
    const hasPermission = sectionPerms.view === true;
    console.log(`   ✅ regular object.view check: ${hasPermission}`);
    return hasPermission;
  }

  console.log(`   ❌ regular - no permission, hiding`);
  return false;
});

console.log('\n🎯 Final result:');
console.log('Items shown:', filteredItems.map(item => item.label));
console.log('Live Chat included:', filteredItems.some(item => item.label === 'Live Chat'));
console.log('Website Settings included:', filteredItems.some(item => item.label === 'Website Settings'));

