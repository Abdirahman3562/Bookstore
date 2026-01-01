// Utility functions for checking permissions

/**
 * JWT decode function
 */
const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('❌ Token decode failed:', error.message);
    return null;
  }
};

/**
 * Get current admin user from JWT token (no API calls)
 */
export const getCurrentAdminUser = async () => {
  try {
    const adminEmail = localStorage.getItem("admin_email");
    const token = localStorage.getItem("admin_token");

    if (!adminEmail || !token) return null;

    // Decode JWT token directly
    const payload = decodeToken(token);
    if (!payload) return null;

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log('⏰ Token expired');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_email');
      return null;
    }

    // Check email match
    if (payload.email !== adminEmail) {
      console.log('❌ Email mismatch');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_email');
      return null;
    }

    // Return user data from JWT
    return {
      _id: payload.id,
      email: payload.email,
      adminRole: payload.adminRole,
      role: payload.adminRole,
      permissions: payload.permissions || {}
    };
  } catch (error) {
    console.error("Error decoding current admin user:", error);
    return null;
  }
};

/**
 * Check if user has permission for a specific action
 * @param {Object} user - User object with permissions
 * @param {string} section - Section name (e.g., 'books', 'users')
 * @param {string} action - Action name ('view', 'add', 'edit', 'delete')
 * @returns {boolean}
 */
export const hasPermission = (user, section, action = 'view') => {
  if (!user) return false;
  
  // Always check granular permissions, even for admin role
  // Admin role doesn't automatically grant all permissions - must be explicitly set
  if (!user.permissions) return false;
  
  const sectionPerms = user.permissions[section];
  
  // Handle old boolean format (backward compatibility)
  if (typeof sectionPerms === 'boolean') {
    return sectionPerms === true;
  }
  
  // Handle new granular format
  if (typeof sectionPerms === 'object' && sectionPerms !== null) {
    return sectionPerms[action] === true;
  }
  
  return false;
};

/**
 * Check if user can view a section
 * Special handling for super admin routes
 */
export const canView = (user, section) => {
  // SUPER ADMIN ROUTES: Require SUPER_ADMIN role
  if (section === "superadmin") {
    return user && user.adminRole === "SUPER_ADMIN";
  }

  // Regular sections: Use permission-based access
  return hasPermission(user, section, 'view');
};

/**
 * Check if user can add items
 */
export const canAdd = (user, section) => hasPermission(user, section, 'add');

/**
 * Check if user can edit items
 */
export const canEdit = (user, section) => hasPermission(user, section, 'edit');

/**
 * Check if user can delete items
 */
export const canDelete = (user, section) => hasPermission(user, section, 'delete');

/**
 * Check if user can revoke access (for downloads - revoke is like edit)
 */
export const canRevoke = (user, section) => {
  if (!user) return false;
  
  // Always check granular permissions, even for admin role
  // Admin role doesn't automatically grant all permissions - must be explicitly set
  if (!user.permissions) return false;
  
  const sectionPerms = user.permissions[section];
  
  // Handle old boolean format (backward compatibility)
  if (typeof sectionPerms === 'boolean') {
    return sectionPerms === true;
  }
  
  // Handle new granular format - check both revoke and edit (revoke is essentially edit)
  if (typeof sectionPerms === 'object' && sectionPerms !== null) {
    return sectionPerms.revoke === true || sectionPerms.edit === true;
  }
  
  return false;
};

/**
 * Check if user can view comments (for blog comments)
 */
export const canViewComments = (user) => hasPermission(user, 'blogComments', 'view');

/**
 * Check if user can reply to comments (for blog comments)
 */
export const canReplyToComments = (user) => hasPermission(user, 'blogComments', 'reply');

/**
 * Check if user can delete comments (for blog comments)
 */
export const canDeleteComments = (user) => hasPermission(user, 'blogComments', 'delete');

/**
 * Check if user can view live chat
 */
export const canViewLiveChat = (user) => hasPermission(user, 'liveChat', 'view');

/**
 * Check if user can reply to messages in live chat
 */
export const canReplyLiveChat = (user) => hasPermission(user, 'liveChat', 'reply');


