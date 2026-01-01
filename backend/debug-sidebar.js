// Debug script to test sidebar permission logic
console.log('=== SIDEBAR DEBUG TEST ===');

// Simulate the allMenuItems
const allMenuItems = [
  { path: "/admin/dashboard", label: "Dashboard", permission: "dashboard" },
  { path: "/admin/books", label: "Books", permission: "books" },
  { path: "/admin/downloads", label: "Downloads", permission: "downloads" },
  { path: "/admin/purchased", label: "Purchased", permission: "purchased" },
  { path: "/admin/testimonials", label: "Testimonials", permission: "testimonials" },
  { path: "/admin/contacts", label: "Contacts", permission: "contacts" },
  { path: "/admin/live-chat", label: "Live Chat", permission: "liveChat" },
  { path: "/admin/users", label: "Users", permission: "users" },
  { path: "/admin/authors", label: "Authors", permission: "authors" },
  { path: "/admin/blogs", label: "Blogs", permission: "blogs" },
  { path: "/admin/website-settings", label: "Website Settings", permission: "websiteSettings", adminOnly: true },
];

// Simulate currentUser from JWT (based on what we know from database)
const currentUser = {
  _id: "69553030a10ebc7b312ea158",
  email: "maanow@gmail.com",
  adminRole: "admin",
  permissions: {
    dashboard: { view: true, add: false, edit: false, delete: false },
    books: { view: true, add: true, edit: true, delete: true },
    downloads: { view: true, add: false, edit: false, delete: false, revoke: true },
    purchased: { view: true, add: false, edit: true, delete: true },
    testimonials: { view: true, add: true, edit: true, delete: true },
    users: { view: true, add: false, edit: true, delete: false },
    authors: { view: true, add: true, edit: true, delete: true },
    blogs: { view: true, add: true, edit: true, delete: true },
    blogComments: { view: true, reply: true, delete: true },
    contacts: { view: true, add: false, edit: true, delete: true },
    websiteSettings: { view: true, add: false, edit: true, delete: false },
    addAdminUser: { view: true, add: true, edit: true, delete: true },
    liveChat: { view: true, reply: true }
  }
};

console.log('Current User:', {
  email: currentUser.email,
  role: currentUser.adminRole,
  permissionsCount: Object.keys(currentUser.permissions).length
});

// Test the filtering logic (same as sidebar)
const filteredItems = allMenuItems.filter(item => {
  const permissionKey = item.permission;
  console.log(`\n🔍 Testing ${item.label} (${permissionKey})`);

  // TEMPORARY FIX: Always show critical items for admin users
  if (permissionKey === 'liveChat' || permissionKey === 'websiteSettings') {
    console.log(`   ✅ TEMP FIX: Always showing ${item.label} for admin user`);
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
    console.log(`   ❌ adminOnly - no permission found, hiding item`);
    return false;
  }

  // Check regular items (not admin-only)
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

  console.log(`   ❌ regular - no permission found, hiding item`);
  return false;
});

console.log('\n🎯 FINAL RESULT:');
console.log('Menu items that will be shown:');
filteredItems.forEach(item => {
  console.log(`  ✅ ${item.label} (${item.permission})`);
});

console.log('\n📊 SUMMARY:');
console.log(`Total items: ${allMenuItems.length}`);
console.log(`Filtered items: ${filteredItems.length}`);
console.log(`Live Chat included: ${filteredItems.some(item => item.label === 'Live Chat')}`);
console.log(`Website Settings included: ${filteredItems.some(item => item.label === 'Website Settings')}`);

console.log('\n=== DEBUG COMPLETE ===');




