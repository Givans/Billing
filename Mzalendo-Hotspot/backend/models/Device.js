import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nasIp: {
    type: String,
    required: true,
    unique: true
  },
  location: String,
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  lastSeen: Date,
  stats: {
    onlineCustomers: {
      type: Number,
      default: 0
    },
    totalCustomers: {
      type: Number,
      default: 0
    },
    revenueToday: {
      type: Number,
      default: 0
    },
    revenueMonth: {
      type: Number,
      default: 0
    }
  },
  secret: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Method to update device status
deviceSchema.methods.updateStatus = async function(isOnline, onlineCount = 0) {
  this.status = isOnline ? 'online' : 'offline';
  this.lastSeen = new Date();
  this.stats.onlineCustomers = onlineCount;
  await this.save();
  return this;
};

export default mongoose.model('Device', deviceSchema);