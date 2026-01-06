import express from 'express';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to hash phone number
const hashPhone = (phone) => {
  if (!phone) return null;
  return crypto.createHash('sha256').update(phone).digest('hex');
};

// Get all customers with filters, pagination, and time range
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      status = 'all', 
      device = 'all',
      connection = 'all', // online/offline filter
      page = 1,
      limit = 20,
      timeRange = 'weekly', // Changed default to weekly
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;
    
    const skip = (page - 1) * limit;
    let query = {};
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }
    
    // Device filter
    if (device && device !== 'all') {
      query.device = device;
    }
    
    // Connection status filter (online/offline)
    if (connection !== 'all') {
      if (connection === 'online') {
        query['session.isOnline'] = true;
      } else if (connection === 'offline') {
        query['session.isOnline'] = false;
      }
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { macAddress: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Time range filter
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      // Custom date range
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      switch (timeRange) {
        case 'today':
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          dateFilter.createdAt = { $gte: startOfDay };
          break;
        case 'weekly':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          dateFilter.createdAt = { $gte: startOfWeek };
          break;
        case 'monthly':
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter.createdAt = { $gte: firstDayOfMonth };
          break;
        case 'yearly':
          const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
          dateFilter.createdAt = { $gte: firstDayOfYear };
          break;
        case 'all':
          // No date filter
          break;
      }
    }
    
    // Combine date filter with other filters
    if (Object.keys(dateFilter).length > 0) {
      query = { ...query, ...dateFilter };
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Fetch customers with pagination
    const customers = await Customer.find(query)
      .populate('currentPackage.package', 'name price duration colorCode')
      .populate('device', 'name nasIp location')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Customer.countDocuments(query);
    
    // Get counts for filters
    const onlineCount = await Customer.countDocuments({ 
      ...query,
      'session.isOnline': true 
    });
    
    const activeCount = await Customer.countDocuments({ 
      ...query,
      status: 'active' 
    });
    
    const expiredCount = await Customer.countDocuments({ 
      ...query,
      status: 'expired' 
    });
    
    const disabledCount = await Customer.countDocuments({ 
      ...query,
      status: 'disabled' 
    });
    
    res.json({
      success: true,
      customers,
      counts: {
        total,
        online: onlineCount,
        active: activeCount,
        expired: expiredCount,
        disabled: disabledCount
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch customers',
      message: error.message 
    });
  }
});

// Add this endpoint for quick actions
router.post('/:id/actions', authenticate, checkPermission('canEditCustomers'), async (req, res) => {
  try {
    const { action } = req.body;
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    switch (action) {
      case 'extend':
        // Extend subscription by 30 days
        const newExpiry = new Date(customer.currentPackage.expiryDate);
        newExpiry.setDate(newExpiry.getDate() + 30);
        customer.currentPackage.expiryDate = newExpiry;
        customer.status = 'active';
        break;
        
      case 'expire':
        // Set to expired
        customer.status = 'expired';
        break;
        
      case 'enable':
        customer.status = 'active';
        break;
        
      case 'disable':
        customer.status = 'disabled';
        break;
        
      case 'delete':
        await Customer.findByIdAndDelete(req.params.id);
        return res.json({
          success: true,
          message: 'Customer deleted successfully'
        });
    }
    
    await customer.save();
    
    res.json({
      success: true,
      message: `Customer ${action}d successfully`,
      customer
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});


// Get customer statistics
router.get('/stats', async (req, res) => {
  try {
    const { timeRange = 'thisMonth', device } = req.query;
    
    let matchQuery = {};
    
    // Time range filter
    if (timeRange === 'thisMonth') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      matchQuery.createdAt = { $gte: firstDay };
    } else if (timeRange === 'lastMonth') {
      const now = new Date();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      matchQuery.createdAt = { $gte: firstDayLastMonth, $lte: lastDayLastMonth };
    }
    
    // Device filter
    if (device && device !== 'all') {
      matchQuery.device = device;
    }
    
    // Get statistics
    const stats = await Customer.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          online: {
            $sum: { $cond: [{ $eq: ['$session.isOnline', true] }, 1, 0] }
          },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          expired: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          disabled: {
            $sum: { $cond: [{ $eq: ['$status', 'disabled'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Get this month count
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await Customer.countDocuments({
      createdAt: { $gte: firstDayThisMonth },
      ...(device && device !== 'all' ? { device } : {})
    });
    
    // Get last month count
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthCount = await Customer.countDocuments({
      createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
      ...(device && device !== 'all' ? { device } : {})
    });
    
    res.json({
      success: true,
      stats: {
        ...(stats[0] || { total: 0, online: 0, active: 0, expired: 0, disabled: 0 }),
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// Check phone number for existing payments
router.get('/check-phone/:phoneNumber', authenticate, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Find payment with this phone number
    const payment = await Payment.findOne({ 
      phoneNumber: phoneNumber.startsWith('254') ? phoneNumber : `254${phoneNumber}`
    }).sort({ createdAt: -1 });
    
    if (!payment) {
      return res.json({
        exists: false,
        message: 'No payment record found for this phone number'
      });
    }
    
    // Get the customer from payment to get MAC address
    const customer = await Customer.findById(payment.customer);
    
    if (!customer) {
      return res.json({
        exists: false,
        message: 'Customer not found for this payment'
      });
    }
    
    res.json({
      exists: true,
      macAddress: customer.macAddress,
      payment,
      customer
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Create customer from phone number
router.post('/', authenticate, checkPermission('canEditCustomers'), async (req, res) => {
  try {
    const { phoneNumber, device, package: packageId, macAddress } = req.body;
    
    if (!phoneNumber || !device || !packageId) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number, device, and package are required' 
      });
    }
    
    // Check if customer already exists with this MAC
    const existingCustomer = await Customer.findOne({ 
      macAddress: macAddress.toUpperCase() 
    });
    
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer with this MAC address already exists' 
      });
    }
    
    // Create customer
    const customerData = {
      macAddress: macAddress.toUpperCase(),
      phoneNumber,
      hashedPhone: hashPhone(phoneNumber),
      device,
      currentPackage: {
        package: packageId,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
        dataUsed: 0
      },
      status: 'active',
      createdBy: req.user._id
    };
    
    const customer = new Customer(customerData);
    await customer.save();
    
    // Update device stats
    await updateDeviceStats(device);
    
    res.status(201).json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Helper to update device stats
async function updateDeviceStats(deviceId) {
  try {
    const customerCount = await Customer.countDocuments({ device: deviceId });
    const onlineCount = await Customer.countDocuments({ 
      device: deviceId,
      'session.isOnline': true 
    });
    
    await Device.findByIdAndUpdate(deviceId, {
      'stats.totalCustomers': customerCount,
      'stats.onlineCustomers': onlineCount
    });
  } catch (error) {
    console.error('Error updating device stats:', error);
  }
}

// Other existing routes remain the same...
// Get customer by MAC
router.get('/mac/:mac', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      macAddress: req.params.mac.toUpperCase() 
    })
    .populate('currentPackage.package')
    .populate('device');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get customer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('currentPackage.package')
      .populate('device')
      .populate('createdBy', 'name email');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update customer
router.put('/:id', authenticate, checkPermission('canEditCustomers'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    // Update hashed phone if phone number changed
    if (req.body.phoneNumber && req.body.phoneNumber !== customer.phoneNumber) {
      req.body.hashedPhone = hashPhone(req.body.phoneNumber);
    }
    
    Object.assign(customer, req.body);
    await customer.save();
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update customer package
router.post('/:id/package', authenticate, async (req, res) => {
  try {
    const { packageId, expiryDate } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    customer.currentPackage = {
      package: packageId,
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      dataUsed: 0
    };
    
    customer.status = 'active';
    await customer.save();
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Check customer status
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('currentPackage.package');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }
    
    const hasActiveSubscription = customer.hasActiveSubscription();
    
    res.json({
      success: true,
      isActive: customer.status === 'active',
      hasActiveSubscription,
      currentPackage: customer.currentPackage,
      expiryDate: customer.currentPackage?.expiryDate,
      dataUsed: customer.currentPackage?.dataUsed || 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;