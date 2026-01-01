# Multi-Tenant SaaS Setup Guide

## Overview
This bookstore application has been converted to a full multi-tenant SaaS platform with complete tenant isolation.

## Architecture

### Database Structure
- **Single Database** with tenant isolation using `tenant_id`
- Every data table includes `tenant_id` for complete isolation
- SUPER_ADMIN has `tenant_id = null` (platform owner)

### Roles

1. **SUPER_ADMIN** (Platform Owner)
   - Can view and manage all tenants
   - Can create, edit, suspend tenants
   - Can create admins for tenants
   - Can manage subscriptions
   - Has access to global analytics
   - No tenant_id (null)

2. **ADMIN** (Tenant Admin)
   - Can only access data where `tenant_id = their tenant`
   - Can manage users, orders, messages
   - Can view tenant-specific dashboard
   - Has `tenant_id` set

3. **USER** (End User)
   - Register/login under a specific tenant
   - Can only see their own data
   - Has `tenant_id` set

## Setup Instructions

### 1. Create SUPER_ADMIN User

```bash
cd backend
node create-super-admin.js [email] [password] [name]
```

Example:
```bash
node create-super-admin.js admin@platform.com Admin123! "Platform Admin"
```

Or set environment variables:
```env
SUPER_ADMIN_EMAIL=admin@platform.com
SUPER_ADMIN_PASSWORD=Admin123!
SUPER_ADMIN_NAME=Platform Admin
```

### 2. Database Migration

**IMPORTANT**: Existing data needs migration!

For existing data, you need to:
1. Create a default tenant
2. Assign all existing records to that tenant
3. Update all models to include `tenant_id`

Migration script example:
```javascript
// Create default tenant
const defaultTenant = await Tenant.create({
  name: "Default Tenant",
  contactEmail: "admin@example.com",
  status: "active"
});

// Update all existing records
await User.updateMany({}, { tenantId: defaultTenant._id });
await Book.updateMany({}, { tenantId: defaultTenant._id });
// ... etc for all models
```

### 3. Environment Variables

Add to `.env`:
```env
JWT_SECRET=your_secret_key_here
MONGODB_URI=your_mongodb_connection_string
```

### 4. Subscription Expiration Cron Job

Set up a daily cron job to expire subscriptions:

```bash
# Add to crontab (runs daily at midnight)
0 0 * * * cd /path/to/backend && node utils/subscriptionCron.js
```

Or use a task scheduler like `node-cron` in your application.

## API Endpoints

### Super Admin Routes (require SUPER_ADMIN role)

#### Tenants Management
- `GET /api/superadmin/tenants` - Get all tenants
- `GET /api/superadmin/tenants/:id` - Get tenant by ID
- `POST /api/superadmin/tenants` - Create new tenant
- `PUT /api/superadmin/tenants/:id` - Update tenant
- `PUT /api/superadmin/tenants/:id/suspend` - Suspend tenant
- `PUT /api/superadmin/tenants/:id/activate` - Activate tenant
- `DELETE /api/superadmin/tenants/:id` - Delete tenant
- `POST /api/superadmin/tenants/:tenantId/admins` - Create admin for tenant
- `GET /api/superadmin/tenants/:tenantId/admins` - Get tenant admins

#### Subscriptions Management
- `GET /api/superadmin/subscriptions` - Get all subscriptions
- `GET /api/superadmin/subscriptions/:id` - Get subscription by ID
- `POST /api/superadmin/subscriptions` - Create subscription
- `PUT /api/superadmin/subscriptions/:id` - Update subscription
- `PUT /api/superadmin/subscriptions/:id/cancel` - Cancel subscription
- `GET /api/superadmin/subscriptions/expiring` - Get expiring subscriptions

#### Dashboard
- `GET /api/superadmin/dashboard` - Get dashboard stats

### Tenant-Scoped Routes

All existing routes now require:
- Tenant resolution (via header, subdomain, or JWT)
- Active subscription check
- Tenant access verification

## Middleware

### Tenant Resolution
- `resolveTenant` - Resolves tenant from request (header, subdomain, or JWT)
- `requireTenant` - Ensures tenant exists and is active
- `checkSubscription` - Verifies tenant has active subscription
- `checkTenantAccess` - Ensures user can only access their tenant's data
- `requireSuperAdmin` - Requires SUPER_ADMIN role
- `checkRole(...roles)` - Role-based access control

## Frontend Integration

### Tenant Resolution
The frontend should send tenant information via:
1. **X-Tenant-Id header** (recommended for API calls)
2. **Subdomain** (e.g., tenant1.bookstore.com)
3. **JWT token** (tenantId included in token)

### Super Admin Dashboard
Access at: `/superadmin/dashboard`

Features:
- View all tenants
- Manage subscriptions
- Create tenant admins
- Global analytics

## Security Considerations

1. **Tenant Isolation**: All queries must filter by `tenant_id`
2. **Subscription Checks**: Active subscription required for access
3. **Role-Based Access**: SUPER_ADMIN bypasses tenant checks
4. **JWT Tokens**: Include `tenantId` for validation

## Testing

1. Create SUPER_ADMIN user
2. Login as SUPER_ADMIN
3. Create a tenant
4. Create subscription for tenant
5. Create admin for tenant
6. Login as tenant admin
7. Verify tenant isolation

## Notes

- All existing controllers need to be updated to filter by `tenant_id`
- Frontend needs to be updated to handle tenant context
- Subscription expiration is handled automatically via cron job
- SUPER_ADMIN can access all tenants without restrictions







