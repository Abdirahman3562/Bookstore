import jwt from 'jsonwebtoken';

// Check what the JWT token contains
const secret = process.env.JWT_SECRET || "fallback_secret_key_change_in_production";

// Simulate what the frontend does - get token from localStorage
// Since we can't access localStorage here, let's create a test token
// with the same payload structure

const testPayload = {
  id: "6955262620042c7e6734f872", // maanow@gmail.com admin ID
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
  },
  tenantId: "695525d020042c7e6734f6fb"
};

const token = jwt.sign(testPayload, secret, { expiresIn: "1d" });

console.log('Generated test JWT token:');
console.log(token);

// Decode it back
const decoded = jwt.verify(token, secret);
console.log('\nDecoded JWT payload:');
console.log(JSON.stringify(decoded, null, 2));

// Test the permission checking logic
console.log('\nTesting permission checks:');
console.log('liveChat permission check:', decoded.permissions.liveChat?.view === true);
console.log('websiteSettings permission check:', decoded.permissions.websiteSettings?.view === true);




