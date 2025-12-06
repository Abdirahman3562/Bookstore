// Utility functions for checking permissions

/**
 * Get current admin user from localStorage and API
 */
export const getCurrentAdminUser = async () => {
  try {
    const adminEmail = localStorage.getItem("admin_email");
    if (!adminEmail) return null;

    const axios = (await import("axios")).default;

    // Try admins API first
    try {
      const adminsResponse = await axios.get("http://localhost:3000/api/admins");
      const admins = adminsResponse.data.data || [];
      const admin = admins.find(a => a.email === adminEmail);
      if (admin) return admin;
    } catch (error) {
      console.log("Admins API not available, trying users API");
    }

    // Fallback to users API
    const usersResponse = await axios.get("http://localhost:3000/api/users");
    const users = usersResponse.data.data || [];
    return users.find(u => u.email === adminEmail) || null;
  } catch (error) {
    console.error("Error fetching current admin user:", error);
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
 */
export const canView = (user, section) => hasPermission(user, section, 'view');

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


