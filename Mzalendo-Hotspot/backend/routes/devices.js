// routes/devices.js
import express from 'express';
import Device from '../models/Device.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all devices with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Build query
    const query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nasIp: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get devices
    const devices = await Device.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('stats.onlineCustomers')
      .lean();
    
    // Get total count for pagination
    const total = await Device.countDocuments(query);
    
    // Calculate additional stats for each device
    const devicesWithStats = await Promise.all(
      devices.map(async (device) => {
        const [customerStats, paymentStats] = await Promise.all([
          Customer.countDocuments({ device: device._id }),
          Payment.aggregate([
            { $match: { device: device._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ])
        ]);
        
        // Get online customers count
        const onlineCustomers = await Customer.countDocuments({ 
          device: device._id,
          'session.isOnline': true 
        });
        
        return {
          ...device,
          stats: {
            ...device.stats,
            totalCustomers: customerStats,
            onlineCustomers: onlineCustomers,
            revenueMonth: paymentStats[0]?.total || 0,
            // Calculate revenue for today
            revenueToday: await calculateTodayRevenue(device._id)
          }
        };
      })
    );
    
    // Calculate overall stats
    const stats = {
      total: total,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      totalCustomers: await Customer.countDocuments(),
      onlineCustomers: await Customer.countDocuments({ 'session.isOnline': true }),
      monthlyRevenue: await calculateMonthlyRevenue(),
      avgUptime: await calculateAverageUptime(devices)
    };
    
    res.json({
      success: true,
      data: {
        devices: devicesWithStats,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Helper function to calculate today's revenue for a device
async function calculateTodayRevenue(deviceId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const result = await Payment.aggregate([
    { 
      $match: { 
        device: deviceId,
        status: 'completed',
        createdAt: { $gte: startOfDay }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return result[0]?.total || 0;
}

// Helper function to calculate monthly revenue
async function calculateMonthlyRevenue() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const result = await Payment.aggregate([
    { 
      $match: { 
        status: 'completed',
        createdAt: { $gte: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  return result[0]?.total || 0;
}

// Helper function to calculate average uptime
async function calculateAverageUptime(devices) {
  const onlineDevices = devices.filter(d => d.status === 'online');
  if (onlineDevices.length === 0) return 0;
  
  const now = new Date();
  const totalUptime = onlineDevices.reduce((sum, device) => {
    const lastSeen = device.lastSeen || device.updatedAt;
    const uptime = Math.floor((now - new Date(lastSeen)) / 1000);
    return sum + uptime;
  }, 0);
  
  return Math.floor(totalUptime / onlineDevices.length);
}

// Create device
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Validate required fields
    const { name, nasIp, secret } = req.body;
    if (!name || !nasIp || !secret) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, NAS IP, and secret are required' 
      });
    }
    
    // Check if device with same NAS IP already exists
    const existingDevice = await Device.findOne({ nasIp });
    if (existingDevice) {
      return res.status(400).json({ 
        success: false,
        error: 'Device with this NAS IP already exists' 
      });
    }
    
    // Create device
    const deviceData = {
      ...req.body,
      createdBy: req.user._id,
      stats: {
        onlineCustomers: 0,
        totalCustomers: 0,
        revenueToday: 0,
        revenueMonth: 0
      }
    };
    
    const device = new Device(deviceData);
    await device.save();
    
    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: device
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get device details
router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ 
        success: false,
        error: 'Device not found' 
      });
    }
    
    // Get detailed statistics
    const [customerStats, paymentStats, recentPayments, onlineCustomers] = await Promise.all([
      // Customer statistics
      Customer.aggregate([
        { $match: { device: device._id } },
        { 
          $group: {
            _id: null,
            total: { $sum: 1 },
            online: { 
              $sum: { 
                $cond: [{ $eq: ['$session.isOnline', true] }, 1, 0] 
              } 
            }
          }
        }
      ]),
      
      // Payment statistics
      Payment.aggregate([
        { $match: { device: device._id, status: 'completed' } },
        { 
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            todayRevenue: {
              $sum: {
                $cond: [
                  { 
                    $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))] 
                  },
                  '$amount',
                  0
                ]
              }
            },
            monthRevenue: {
              $sum: {
                $cond: [
                  { 
                    $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] 
                  },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]),
      
      // Recent payments
      Payment.find({ device: device._id })
        .populate('customer', 'macAddress phoneNumber')
        .populate('package', 'name price')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      
      // Currently online customers
      Customer.find({ 
        device: device._id,
        'session.isOnline': true 
      })
        .populate('currentPackage.package', 'name')
        .sort({ 'session.startTime': -1 })
        .limit(10)
        .lean()
    ]);
    
    res.json({
      success: true,
      data: {
        device,
        stats: {
          customers: customerStats[0] || { total: 0, online: 0 },
          payments: paymentStats[0] || { 
            totalRevenue: 0, 
            totalTransactions: 0,
            todayRevenue: 0,
            monthRevenue: 0
          }
        },
        recentPayments,
        onlineCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update device
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow updating NAS IP to an existing one
    if (updates.nasIp) {
      const existingDevice = await Device.findOne({ 
        nasIp: updates.nasIp,
        _id: { $ne: req.params.id }
      });
      
      if (existingDevice) {
        return res.status(400).json({ 
          success: false,
          error: 'Another device with this NAS IP already exists' 
        });
      }
    }
    
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!device) {
      return res.status(404).json({ 
        success: false,
        error: 'Device not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Device updated successfully',
      data: device
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Delete device
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Check if device has customers
    const customerCount = await Customer.countDocuments({ device: req.params.id });
    if (customerCount > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete device with existing customers' 
      });
    }
    
    const device = await Device.findByIdAndDelete(req.params.id);
    
    if (!device) {
      return res.status(404).json({ 
        success: false,
        error: 'Device not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get device status with system resources
router.get('/:id/status', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ 
        success: false,
        error: 'Device not found' 
      });
    }
    
    // Get real-time statistics
    const onlineCustomers = await Customer.countDocuments({ 
      device: device._id,
      'session.isOnline': true 
    });
    
    // Calculate uptime
    let uptime = 0;
    if (device.status === 'online' && device.lastSeen) {
      uptime = Math.floor((new Date() - new Date(device.lastSeen)) / 1000);
    }
    
    // Get system resources (simulated for now - integrate with real monitoring)
    // In production, this would come from your monitoring system or MikroTik API
    const systemResources = {
      cpu: device.status === 'online' ? Math.floor(Math.random() * 30) + 20 : 0,
      ram: {
        total: 4096, // 4GB in MB
        used: device.status === 'online' ? Math.floor(Math.random() * 2048) + 1024 : 0,
        percentage: device.status === 'online' ? Math.floor(Math.random() * 30) + 40 : 0
      },
      disk: {
        total: 8192, // 8GB in MB
        used: device.status === 'online' ? Math.floor(Math.random() * 4096) + 2048 : 0,
        percentage: device.status === 'online' ? Math.floor(Math.random() * 30) + 40 : 0
      },
      uptime: uptime
    };
    
    res.json({
      success: true,
      data: {
        device: {
          _id: device._id,
          name: device.name,
          nasIp: device.nasIp,
          status: device.status,
          lastSeen: device.lastSeen,
          location: device.location
        },
        systemResources,
        onlineCustomers,
        health: calculateDeviceHealth(systemResources)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Calculate device health based on system resources
function calculateDeviceHealth(resources) {
  if (resources.cpu === 0) return 'offline';
  
  if (resources.cpu > 80 || resources.ram.percentage > 80 || resources.disk.percentage > 80) {
    return 'critical';
  } else if (resources.cpu > 60 || resources.ram.percentage > 60 || resources.disk.percentage > 60) {
    return 'warning';
  }
  return 'healthy';
}

// Update device status manually
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['online', 'offline'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status. Must be "online" or "offline"' 
      });
    }
    
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ 
        success: false,
        error: 'Device not found' 
      });
    }
    
    device.status = status;
    device.lastSeen = new Date();
    
    if (status === 'offline') {
      // Set all customers offline for this device
      await Customer.updateMany(
        { device: device._id, 'session.isOnline': true },
        { 'session.isOnline': false, 'session.sessionId': null }
      );
      
      device.stats.onlineCustomers = 0;
    }
    
    await device.save();
    
    res.json({
      success: true,
      message: `Device status updated to ${status}`,
      data: device
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get device statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ 
        success: false,
        error: 'Device not found' 
      });
    }
    
    // Get time-based statistics
    const { period = 'day' } = req.query;
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const [revenueStats, customerStats, packageStats] = await Promise.all([
      // Revenue statistics by time
      Payment.aggregate([
        {
          $match: {
            device: device._id,
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: period === 'hour' ? '%H:00' : '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Customer statistics
      Customer.aggregate([
        { $match: { device: device._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Package usage statistics
      Payment.aggregate([
        {
          $match: {
            device: device._id,
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$package',
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        device: {
          _id: device._id,
          name: device.name,
          status: device.status
        },
        revenueStats,
        customerStats: customerStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        packageStats,
        period
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;