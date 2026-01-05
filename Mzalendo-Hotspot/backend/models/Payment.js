import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  // **DEVICE ASSOCIATION**
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'cash', 'kopokopo', 'voucher'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  mpesaReceiptNumber: String,
  phoneNumber: String,
  // **STK PUSH DATA**
  stkData: {
    checkoutRequestId: String,
    merchantRequestId: String,
    connectionType: String,
    initiatedAt: Date,
    callbackReceived: {
      type: Boolean,
      default: false
    },
    responseCode: String,
    responseDescription: String,
    callbackData: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  gatewayData: mongoose.Schema.Types.Mixed,
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for faster queries
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ device: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'stkData.checkoutRequestId': 1 });

// Method to update payment with STK callback
paymentSchema.methods.updateWithSTKCallback = async function(callbackData) {
  this.stkData.callbackReceived = true;
  this.stkData.callbackData = callbackData;
  
  const { ResultCode, ResultDesc, CallbackMetadata } = callbackData;
  this.stkData.responseCode = ResultCode;
  this.stkData.responseDescription = ResultDesc;
  
  if (parseInt(ResultCode) === 0) {
    this.status = 'completed';
    
    // Extract M-Pesa receipt number
    if (CallbackMetadata?.Item) {
      CallbackMetadata.Item.forEach(item => {
        if (item.Name === 'MpesaReceiptNumber') {
          this.mpesaReceiptNumber = item.Value;
        }
      });
    }
  } else {
    this.status = 'failed';
  }
  
  await this.save();
  return this;
};

export default mongoose.model('Payment', paymentSchema);