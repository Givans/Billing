// models/Permission.js - NEW FILE
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: [
      'dashboard',
      'customers',
      'payments',
      'devices',
      'packages',
      'vouchers',
      'users',
      'reports',
      'settings',
      'audit_logs'
    ]
  },
  action: {
    type: String,
    required: true,
    enum: ['view', 'create', 'edit', 'delete', 'export', 'manage']
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique module+action combinations
permissionSchema.index({ module: 1, action: 1 }, { unique: true });

export default mongoose.model('Permission', permissionSchema);