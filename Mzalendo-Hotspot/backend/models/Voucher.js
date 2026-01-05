import mongoose from 'mongoose';
import crypto from 'crypto';

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  usedAt: Date,
  expiresAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Generate voucher code before saving
voucherSchema.pre('save', function(next) {
  if (!this.code) {
    // Generate 8-character alphanumeric code
    this.code = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

// Check if voucher is valid
voucherSchema.methods.isValid = function() {
  if (this.isUsed) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

export default mongoose.model('Voucher', voucherSchema);