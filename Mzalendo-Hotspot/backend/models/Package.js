import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  duration: {
    value: { type: Number, required: true },
    unit: { 
      type: String, 
      enum: ['minutes', 'hours', 'days', 'weeks', 'months'],
      required: true 
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  speed: {
    download: { type: Number, default: 10 },
    upload: { type: Number, default: 5 }
  },
  dataLimit: {
    type: String,
    enum: ['unlimited', 'limited'],
    default: 'unlimited'
  },
  dataAmount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  colorCode: {
    type: String,
    default: '#3498db'
  }
}, {
  timestamps: true
});

// Virtual for duration in minutes
packageSchema.virtual('durationInMinutes').get(function() {
  const multipliers = {
    'minutes': 1,
    'hours': 60,
    'days': 1440,
    'weeks': 10080,
    'months': 43200
  };
  return this.duration.value * (multipliers[this.duration.unit] || 60);
});

// Virtual for duration in milliseconds
packageSchema.virtual('durationInMs').get(function() {
  return this.durationInMinutes * 60 * 1000;
});

export default mongoose.model('Package', packageSchema);