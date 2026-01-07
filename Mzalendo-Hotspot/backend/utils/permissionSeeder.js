// utils/permissionSeeder.js
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';

const defaultPermissions = [
  // Dashboard
  { module: 'dashboard', action: 'view', description: 'View dashboard' },
  
  // Customers
  { module: 'customers', action: 'view', description: 'View customers' },
  { module: 'customers', action: 'create', description: 'Create customers' },
  { module: 'customers', action: 'edit', description: 'Edit customers' },
  { module: 'customers', action: 'delete', description: 'Delete customers' },
  { module: 'customers', action: 'export', description: 'Export customers' },
  
  // Payments
  { module: 'payments', action: 'view', description: 'View payments' },
  { module: 'payments', action: 'create', description: 'Create payments' },
  { module: 'payments', action: 'edit', description: 'Edit payments' },
  { module: 'payments', action: 'delete', description: 'Delete payments' },
  { module: 'payments', action: 'refund', description: 'Refund payments' },
  { module: 'payments', action: 'export', description: 'Export payments' },
  
  // Devices
  { module: 'devices', action: 'view', description: 'View devices' },
  { module: 'devices', action: 'create', description: 'Create devices' },
  { module: 'devices', action: 'edit', description: 'Edit devices' },
  { module: 'devices', action: 'delete', description: 'Delete devices' },
  { module: 'devices', action: 'manage', description: 'Manage devices' },
  
  // Packages
  { module: 'packages', action: 'view', description: 'View packages' },
  { module: 'packages', action: 'create', description: 'Create packages' },
  { module: 'packages', action: 'edit', description: 'Edit packages' },
  { module: 'packages', action: 'delete', description: 'Delete packages' },
  
  // Vouchers
  { module: 'vouchers', action: 'view', description: 'View vouchers' },
  { module: 'vouchers', action: 'create', description: 'Create vouchers' },
  { module: 'vouchers', action: 'edit', description: 'Edit vouchers' },
  { module: 'vouchers', action: 'delete', description: 'Delete vouchers' },
  
  // Users
  { module: 'users', action: 'view', description: 'View users' },
  { module: 'users', action: 'create', description: 'Create users' },
  { module: 'users', action: 'edit', description: 'Edit users' },
  { module: 'users', action: 'delete', description: 'Delete users' },
  
  // Reports
  { module: 'reports', action: 'view', description: 'View reports' },
  { module: 'reports', action: 'create', description: 'Create reports' },
  { module: 'reports', action: 'export', description: 'Export reports' },
  
  // Settings
  { module: 'settings', action: 'view', description: 'View settings' },
  { module: 'settings', action: 'edit', description: 'Edit settings' },
  
  // Audit Logs
  { module: 'audit_logs', action: 'view', description: 'View audit logs' },
];

const defaultRoles = [
  {
    name: 'super_admin',
    description: 'Full system access',
    isDefault: true,
    permissions: [] // All permissions implicitly
  },
  {
    name: 'admin',
    description: 'Administrator with most permissions',
    isDefault: true,
    permissions: [
      'dashboard:view',
      'customers:view', 'customers:create', 'customers:edit', 'customers:delete', 'customers:export',
      'payments:view', 'payments:create', 'payments:edit', 'payments:delete', 'payments:refund', 'payments:export',
      'devices:view', 'devices:create', 'devices:edit', 'devices:delete', 'devices:manage',
      'packages:view', 'packages:create', 'packages:edit', 'packages:delete',
      'vouchers:view', 'vouchers:create', 'vouchers:edit', 'vouchers:delete',
      'users:view', 'users:create', 'users:edit',
      'reports:view', 'reports:create', 'reports:export',
      'settings:view',
      'audit_logs:view'
    ]
  },
  {
    name: 'operator',
    description: 'Can manage customers and payments',
    isDefault: true,
    permissions: [
      'dashboard:view',
      'customers:view', 'customers:create', 'customers:edit',
      'payments:view', 'payments:create',
      'devices:view',
      'packages:view',
      'vouchers:view', 'vouchers:create',
      'reports:view'
    ]
  },
  {
    name: 'viewer',
    description: 'Read-only access',
    isDefault: true,
    permissions: [
      'dashboard:view',
      'customers:view',
      'payments:view',
      'devices:view',
      'packages:view',
      'vouchers:view',
      'reports:view'
    ]
  }
];

export const seedPermissions = async () => {
  try {
    // Clear existing permissions
    await Permission.deleteMany({});
    
    // Create permissions
    const createdPermissions = [];
    for (const perm of defaultPermissions) {
      const permission = new Permission(perm);
      await permission.save();
      createdPermissions.push(permission);
    }
    
    console.log('✅ Permissions seeded successfully');
    return createdPermissions;
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
};

export const seedRoles = async (permissions) => {
  try {
    // Clear existing roles (except super_admin if it has users)
    await Role.deleteMany({ name: { $ne: 'super_admin' } });
    
    // Create a map of permission key to ID
    const permissionMap = {};
    permissions.forEach(perm => {
      const key = `${perm.module}:${perm.action}`;
      permissionMap[key] = perm._id;
    });
    
    // Create roles
    for (const roleData of defaultRoles) {
      // Convert permission keys to IDs
      const permissionIds = roleData.permissions.map(key => permissionMap[key]);
      
      const role = new Role({
        name: roleData.name,
        description: roleData.description,
        isDefault: roleData.isDefault,
        permissions: permissionIds
      });
      
      await role.save();
    }
    
    console.log('✅ Roles seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
};