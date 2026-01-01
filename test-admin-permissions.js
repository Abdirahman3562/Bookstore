// Test admin permissions structure
const currentUser = {
  _id: "69553030a10ebc7b312ea158",
  email: "admin@example.com",
  adminRole: "admin",
  permissions: {
    downloads: { view: true, add: false, edit: false, delete: false, revoke: true },
    purchased: { view: true, add: false, edit: true, delete: true },
    testimonials: { view: true, add: true, edit: true, delete: true },
    users: { view: true, add: false, edit: true, delete: false },
    authors: { view: true, add: true, edit: true, delete: true },
    blogs: { view: true, add: true, edit: true, delete: true },
    contacts: { view: true, add: false, edit: true, delete: true }
  }
};

const allMenuItems = [
  { path: "/admin/downloads", label: "Downloads", permission: "downloads" },
  { path: "/admin/purchased", label: "Purchased", permission: "purchased" },
  { path: "/admin/testimonials", label: "Testimonials", permission: "testimonials" },
  { path: "/admin/contacts", label: "Contacts", permission: "contacts" },
  { path: "/admin/users", label: "Users", permission: "users" },
  { path: "/admin/authors", label: "Authors", permission: "authors" },
  { path: "/admin/blogs", label: "Blogs", permission: "blogs" },
];

console.log('Testing permission filtering...');
console.log('User permissions:', Object.keys(currentUser.permissions));

const filteredItems = allMenuItems.filter(item => {
  const permissionKey = item.permission;
  console.log(`\nChecking ${item.label} (${permissionKey})`);

  // Get permission object for this section
  const sectionPerms = currentUser.permissions[permissionKey];
  console.log(`Permission object:`, sectionPerms);

  // Check regular items (not admin-only)
  if (typeof sectionPerms === 'boolean') {
    const hasPermission = sectionPerms === true;
    console.log(`Boolean check: ${hasPermission}`);
    return hasPermission;
  }
  if (typeof sectionPerms === 'object' && sectionPerms !== null) {
    const hasPermission = sectionPerms.view === true;
    console.log(`Object.view check: ${hasPermission}`);
    return hasPermission;
  }

  console.log(`No permission found, hiding item`);
  return false;
});

console.log('\nRESULT:');
console.log('Menu items that should be shown:');
filteredItems.forEach(item => {
  console.log(`✅ ${item.label}`);
});

console.log(`\nTotal: ${filteredItems.length} out of ${allMenuItems.length} items`);

