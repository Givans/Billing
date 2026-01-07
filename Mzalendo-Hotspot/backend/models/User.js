// models/User.js - UPDATED
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: String,
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  customPermissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has permission (combines role permissions + custom permissions)
userSchema.methods.hasPermission = async function(module, action) {
  // Populate role if not already populated
  if (!this.role.populated) {
    await this.populate('role');
  }
  
  // Check role permissions
  const hasRolePermission = await this.role.hasPermission(module, action);
  if (hasRolePermission) return true;
  
  // Check custom permissions
  const Permission = mongoose.model('Permission');
  const permission = await Permission.findOne({ module, action });
  
  if (!permission) return false;
  
  return this.customPermissions.some(perm => 
    perm._id ? perm._id.toString() === permission._id.toString() : perm.toString() === permission._id.toString()
  );
};

// Get all permissions for user (role + custom)
userSchema.methods.getAllPermissions = async function() {
  const rolePermissions = await this.role.getPermissions();
  
  const customPermissions = await mongoose.model('Permission').find({
    _id: { $in: this.customPermissions }
  });
  
  // Merge and deduplicate
  const allPermissions = [...rolePermissions, ...customPermissions];
  const permissionMap = new Map();
  
  allPermissions.forEach(perm => {
    const key = `${perm.module}:${perm.action}`;
    if (!permissionMap.has(key)) {
      permissionMap.set(key, perm);
    }
  });
  
  return Array.from(permissionMap.values());
};

// Get permission summary by module
userSchema.methods.getPermissionSummary = async function() {
  const allPermissions = await this.getAllPermissions();
  
  const summary = {};
  allPermissions.forEach(perm => {
    if (!summary[perm.module]) {
      summary[perm.module] = [];
    }
    summary[perm.module].push(perm.action);
  });
  
  return summary;
};

export default mongoose.model('User', userSchema);