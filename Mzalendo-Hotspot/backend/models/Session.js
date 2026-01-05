import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  username: String, // MAC address for hotspot
  startTime: {
    type: Date,
    default: Date.now
  },
  stopTime: Date,
  ipAddress: String,
  nasIp: String,
  data: {
    download: { type: Number, default: 0 },
    upload: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  duration: Number, // in seconds
  terminationCause: String
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ customer: 1, startTime: -1 });
sessionSchema.index({ sessionId: 1 }, { unique: true });
sessionSchema.index({ stopTime: 1 }, { sparse: true });

// Calculate duration before saving
sessionSchema.pre('save', function(next) {
  if (this.stopTime && this.startTime) {
    this.duration = Math.floor((this.stopTime - this.startTime) / 1000);
  }
  next();
});

export default mongoose.model('Session', sessionSchema);