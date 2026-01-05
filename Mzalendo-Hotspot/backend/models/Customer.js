import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  macAddress: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  phoneNumber: String,
  hashedPhone: String,
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  currentPackage: {
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package'
    },
    expiryDate: Date,
    dataUsed: {
      type: Number,
      default: 0
    }
  },
  // RADIUS session tracking
  session: {
    sessionId: String,
    isOnline: {
      type: Boolean,
      default: false
    },
    startTime: Date,
    ipAddress: String,
    nasIp: String
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'disabled'],
    default: 'active'
  },
  lastSeen: Date,
  totalConnections: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ macAddress: 1, device: 1 }, { unique: true });
customerSchema.index({ 'session.isOnline': 1 });
customerSchema.index({ 'currentPackage.expiryDate': 1 });
customerSchema.index({ status: 1 });

// Check if customer has active subscription
customerSchema.methods.hasActiveSubscription = function() {
  if (this.status !== 'active') return false;
  if (!this.currentPackage || !this.currentPackage.expiryDate) return false;
  return new Date() < new Date(this.currentPackage.expiryDate);
};

// Update session status
customerSchema.methods.updateSession = async function(isOnline, sessionData = {}) {
  this.session.isOnline = isOnline;
  this.lastSeen = new Date();
  
  if (isOnline) {
    this.totalConnections += 1;
    this.session.sessionId = sessionData.sessionId || this.session.sessionId;
    this.session.startTime = sessionData.startTime || new Date();
    this.session.ipAddress = sessionData.ipAddress || this.session.ipAddress;
    this.session.nasIp = sessionData.nasIp || this.session.nasIp;
  } else {
    this.session.sessionId = null;
    this.session.startTime = null;
    this.session.ipAddress = null;
  }
  
  await this.save();
  return this;
};

export default mongoose.model('Customer', customerSchema);