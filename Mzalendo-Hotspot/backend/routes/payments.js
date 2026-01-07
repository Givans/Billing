import express from 'express';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import Package from '../models/Package.js';
import Device from '../models/Device.js';
import { authenticate, authorize } from '../middleware/auth.js';
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
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      search,
      status,
      device,
      paymentMethod,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      customer,
      package: packageId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    let query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Device filter
    if (device && device !== 'all') {
      query.device = device;
    }
    
    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    // Customer filter
    if (customer) {
      query.customer = customer;
    }
    
    // Package filter
    if (packageId) {
      query.package = packageId;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { mpesaReceiptNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Fetch payments with pagination
    const payments = await Payment.find(query)
      .populate('customer', 'macAddress phoneNumber')
      .populate('package', 'name price colorCode')
      .populate('device', 'name nasIp')
      .populate('initiatedBy', 'username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    
    // Get payment statistics
    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get daily revenue for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          ...query,
          status: 'completed',
          createdAt: { $gte: sevenDaysAgo }
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
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 7 }
    ]);
    
    // Get payment method breakdown
    const paymentMethodBreakdown = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);
    
    // Get device revenue breakdown
    const deviceRevenue = await Payment.aggregate([
      { 
        $match: { 
          ...query, 
          status: 'completed',
          device: { $exists: true }
        } 
      },
      {
        $group: {
          _id: '$device',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate device names
    const populatedDeviceRevenue = await Promise.all(
      deviceRevenue.map(async (item) => {
        const device = await Device.findById(item._id).select('name nasIp');
        return {
          ...item,
          device: device || { name: 'Unknown', nasIp: '' }
        };
      })
    );
    
    res.json({
      success: true,
      payments,
      stats: stats[0] || {
        totalAmount: 0,
        totalCount: 0,
        completedAmount: 0,
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0
      },
      breakdowns: {
        dailyRevenue,
        paymentMethod: paymentMethodBreakdown,
        deviceRevenue: populatedDeviceRevenue
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Export payments data
router.get('/export', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    let query = { status: 'completed' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const payments = await Payment.find(query)
      .populate('customer', 'macAddress phoneNumber')
      .populate('package', 'name price')
      .populate('device', 'name nasIp')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      // Convert to CSV
      const csvData = payments.map(payment => ({
        'Transaction ID': payment.transactionId || '',
        'Date': payment.createdAt.toISOString(),
        'Customer MAC': payment.customer?.macAddress || '',
        'Customer Phone': payment.customer?.phoneNumber || '',
        'Package': payment.package?.name || '',
        'Amount': payment.amount,
        'Payment Method': payment.paymentMethod,
        'Status': payment.status,
        'Device': payment.device?.name || '',
        'M-Pesa Receipt': payment.mpesaReceiptNumber || ''
      }));
      
      // Convert to CSV string
      const csv = convertToCSV(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        payments
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Helper function to convert to CSV
function convertToCSV(data) {
  const headers = Object.keys(data[0] || {});
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ];
  return csvRows.join('\n');
}

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
router.put('/:id', authenticate,   authorize('payments', 'edit'), async (req, res) => {
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
router.delete('/:id', authenticate,   authorize('payments', 'delete'), async (req, res) => {
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