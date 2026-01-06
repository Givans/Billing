import express from 'express';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import Package from '../models/Package.js';
import Device from '../models/Device.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Add this STK push endpoint
router.post('/hotspot/stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount, packageId, deviceId, macAddress } = req.body;

    // Validate
    if (!phoneNumber || !amount || !packageId || !deviceId || !macAddress) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get device
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get package
    const packageDoc = await Package.findById(packageId);
    if (!packageDoc) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Format phone
    let msisdn = phoneNumber.replace(/\D/g, "");
    if (msisdn.startsWith("0")) msisdn = "254" + msisdn.substring(1);

    // Create payment
    const payment = new Payment({
      transactionType: 'stk_push',
      transactionId: `HS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount: parseFloat(amount),
      phoneNumber: msisdn,
      status: 'initiated',
      device: deviceId,
      package: packageId,
      stkData: {
        checkoutRequestId: '',
        merchantRequestId: '',
        macAddress: macAddress.toUpperCase(),
        nasIp: device.nasIp
      }
    });

    await payment.save();

    // Create or update customer
    let customer = await Customer.findOne({
      macAddress: macAddress.toUpperCase(),
      device: deviceId
    });

    if (!customer) {
      customer = new Customer({
        macAddress: macAddress.toUpperCase(),
        phoneNumber: msisdn,
        device: deviceId,
        status: 'active',
        currentPackage: {
          package: packageId,
          expiryDate: new Date(Date.now() + packageDoc.durationInMs),
          dataUsed: 0
        }
      });
    } else {
      customer.currentPackage = {
        package: packageId,
        expiryDate: new Date(Date.now() + packageDoc.durationInMs),
        dataUsed: 0
      };
      customer.status = 'active';
    }

    await customer.save();

    // Update device customer count
    await Device.findByIdAndUpdate(deviceId, {
      $inc: { 'stats.totalCustomers': 1 }
    });

    // Initiate STK push (call your M-Pesa API)
    const stkResult = await initiateMpesaSTKPush({
      phoneNumber: msisdn,
      amount: amount,
      accountReference: msisdn,
      transactionDesc: `Hotspot: ${packageDoc.name}`
    });

    // Update payment with STK response
    payment.stkData.checkoutRequestId = stkResult.checkoutRequestId;
    payment.stkData.merchantRequestId = stkResult.merchantRequestId;
    await payment.save();

    res.json({
      success: true,
      message: 'STK push initiated',
      data: {
        paymentId: payment._id,
        customerId: customer._id,
        checkoutRequestId: stkResult.checkoutRequestId
      }
    });

  } catch (error) {
    console.error('STK push error:', error);
    res.status(500).json({ error: error.message });
  }
});

// STK callback endpoint
router.post('/mpesa-stk-callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    // Find payment by checkout request ID
    const payment = await Payment.findOne({
      'stkData.checkoutRequestId': callbackData.CheckoutRequestID
    }).populate('customer device package');
    
    if (!payment) {
      return res.json({ ResultCode: 1, ResultDesc: "Payment not found" });
    }
    
    // Update payment status
    if (parseInt(callbackData.ResultCode) === 0) {
      payment.status = 'completed';
      payment.mpesaReceiptNumber = callbackData.MpesaReceiptNumber;
      
      // Update customer package expiry
      if (payment.customer && payment.package) {
        const customer = payment.customer;
        const packageDoc = payment.package;
        
        customer.currentPackage.expiryDate = new Date(Date.now() + packageDoc.durationInMs);
        await customer.save();
        
        // Update device revenue
        await Device.findByIdAndUpdate(payment.device._id, {
          $inc: {
            'stats.revenueToday': payment.amount,
            'stats.revenueMonth': payment.amount
          }
        });
      }
    } else {
      payment.status = 'failed';
    }
    
    await payment.save();
    
    // Always respond success to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: "Success" });
    
  } catch (error) {
    console.error('STK callback error:', error);
    res.json({ ResultCode: 0, ResultDesc: "Success" });
  }
});

// **CHECK STK PAYMENT STATUS**
router.get('/stk-status/:checkoutRequestId', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      'stkData.checkoutRequestId': req.params.checkoutRequestId
    })
      .populate('customer', 'macAddress connectionStatus')
      .populate('device', 'name nasIp')
      .populate('package', 'name');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        customer: payment.customer,
        device: payment.device,
        package: payment.package,
        stkData: {
          checkoutRequestId: payment.stkData.checkoutRequestId,
          responseDescription: payment.stkData.responseDescription,
          initiatedAt: payment.stkData.initiatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **GET PAYMENTS BY DEVICE**
router.get('/device/:deviceId', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let query = {
      device: req.params.deviceId
    };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    const payments = await Payment.find(query)
      .populate('customer', 'macAddress phoneNumber')
      .populate('package', 'name price')
      .populate('device', 'name nasIp')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **DEVICE REVENUE STATISTICS**
router.get('/device/:deviceId/stats', authenticate, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    const stats = await Payment.aggregate([
      {
        $match: {
          device: mongoose.Types.ObjectId(req.params.deviceId),
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Get total revenue
    const total = await Payment.aggregate([
      {
        $match: {
          device: mongoose.Types.ObjectId(req.params.deviceId),
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalCount: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      period,
      startDate,
      stats,
      totals: {
        revenue: total[0]?.totalRevenue || 0,
        count: total[0]?.totalCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// Get all payments
router.get('/',  async (req, res) => {
  try {
    const { 
      limit = 50, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      device,
      customer,
      status,
      startDate,
      endDate 
    } = req.query;
    
    let query = {};
    
    if (device) {
      query.device = device;
    }
    
    if (customer) {
      query.customer = customer;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const payments = await Payment.find(query)
      .populate('customer', 'macAddress username phoneNumber')
      .populate('package', 'name price')
      .populate('device', 'name nasIp')
      .sort(sort)
      .limit(parseInt(limit));
    
    // Get total for pagination
    const total = await Payment.countDocuments(query);
    
    res.json({
      payments,
      total,
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer')
      .populate('package')
      .populate('device');
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment
router.post('/', authenticate, async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const payment = new Payment(paymentData);
    await payment.save();
    
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update payment
router.put('/:id', authenticate, checkPermission('canEditPayments'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    Object.assign(payment, req.body);
    await payment.save();
    
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete payment
router.delete('/:id', authenticate, checkPermission('canDeletePayments'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    await payment.remove();
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// **PLACEHOLDER FUNCTIONS - YOU NEED TO IMPLEMENT THESE**

// M-Pesa STK Push initiation
async function initiateMpesaSTKPush(data) {
  // Implement your M-Pesa STK push logic here
  // This should call Safaricom's Daraja API
  return {
    success: true,
    checkoutRequestId: `ws_CO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    merchantRequestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    customerMessage: "Success. Request accepted for processing"
  };
}

// Add customer to MikroTik
async function addCustomerToMikrotik({ device, customer, pkg }) {
  // Implement MikroTik API integration here
  // Add customer to hotspot with package limits
  console.log(`Adding ${customer.macAddress} to ${device.nasIp} with package ${pkg.name}`);
  return true;
}

export default router;