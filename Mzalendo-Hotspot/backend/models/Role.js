// models/Role.js - NEW FILE
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['super_admin', 'admin', 'operator', 'viewer', 'custom']
  },
  description: String,
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to check if role has specific permission
roleSchema.methods.hasPermission = async function(module, action) {
  if (this.name === 'super_admin') return true;
  
  // Get permission ID
  const Permission = mongoose.model('Permission');
  const permission = await Permission.findOne({ module, action });
  
  if (!permission) return false;
  
  return this.permissions.some(perm => 
    perm._id ? perm._id.toString() === permission._id.toString() : perm.toString() === permission._id.toString()
  );
};

// Method to get all permissions for this role
roleSchema.methods.getPermissions = async function() {
  if (this.name === 'super_admin') {
    const Permission = mongoose.model('Permission');
    return await Permission.find({ isActive: true });
  }
  
  return await mongoose.model('Permission').find({
    _id: { $in: this.permissions }
  });
};

export default mongoose.model('Role', roleSchema);