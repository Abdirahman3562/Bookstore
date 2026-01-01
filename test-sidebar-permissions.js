// Test the sidebar permission logic
const allMenuItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: "BarChart3", permission: "dashboard" },
  { path: "/admin/books", label: "Books", icon: "BookOpen", permission: "books" },
  { path: "/admin/downloads", label: "Downloads", icon: "Download", permission: "downloads" },
  { path: "/admin/purchased", label: "Purchased", icon: "ShoppingCart", permission: "purchased" },
  { path: "/admin/testimonials", label: "Testimonials", icon: "MessageSquare", permission: "testimonials" },
  { path: "/admin/contacts", label: "Contacts", icon: "Mail", permission: "contacts" },
  { path: "/admin/live-chat", label: "Live Chat", icon: "MessageCircle", permission: "liveChat" },
  { path: "/admin/users", label: "Users", icon: "Users", permission: "users" },
  { path: "/admin/authors", label: "Authors", icon: "PenTool", permission: "authors" },
  { path: "/admin/blogs", label: "Blogs", icon: "FileText", permission: "blogs" },
  { path: "/admin/website-settings", label: "Website Settings", icon: "Settings", permission: "websiteSettings", adminOnly: true },
];

// Simulate the user object from JWT
const currentUser = {
  _id: "6955262620042c7e6734f872",
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

console.log('Testing permission filtering...');
console.log('Current user:', currentUser.adminRole);
console.log('Permissions:', currentUser.permissions);

const filteredItems = allMenuItems.filter(item => {
  console.log(`\n🔍 Checking permission for ${item.label} (${item.permission})`);

  // Hide admin-only items if user doesn't have permission
  if (item.adminOnly) {
    const sectionPerms = currentUser.permissions[item.permission];
    console.log(`   - adminOnly item, permissions:`, sectionPerms);

    if (typeof sectionPerms === 'boolean') {
      const hasPermission = sectionPerms === true;
      console.log(`   - boolean permission check: ${hasPermission}`);
      return hasPermission;
    }
    if (typeof sectionPerms === 'object' && sectionPerms !== null) {
      const hasPermission = sectionPerms.view === true;
      console.log(`   - object permission check (view): ${hasPermission}`);
      return hasPermission;
    }
    console.log(`   - no permission found, hiding item`);
    return false;
  }

  // Check if permission is explicitly set to true (for view access)
  const sectionPerms = currentUser.permissions[item.permission];
  console.log(`   - regular item, permissions:`, sectionPerms);

  if (typeof sectionPerms === 'boolean') {
    const hasPermission = sectionPerms === true;
    console.log(`   - boolean permission check: ${hasPermission}`);
    return hasPermission;
  }
  if (typeof sectionPerms === 'object' && sectionPerms !== null) {
    const hasPermission = sectionPerms.view === true;
    console.log(`   - object permission check (view): ${hasPermission}`);
    return hasPermission;
  }
  console.log(`   - no permission found, hiding item`);
  return false;
});

console.log('\n✅ Filtered menu items:', filteredItems.map(item => item.label));
console.log('Total items shown:', filteredItems.length);

