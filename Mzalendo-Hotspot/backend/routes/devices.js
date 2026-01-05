import express from 'express';
import Device from '../models/Device.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all devices
router.get('/', authenticate, async (req, res) => {
  try {
    const devices = await Device.find()
      .populate('availablePackages', 'name price')
      .sort({ createdAt: -1 });
    
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create device
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const deviceData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const device = new Device(deviceData);
    await device.save();
    
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update device status (from MikroTik API)
router.post('/:id/status', authenticate, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const statusData = req.body;
    await device.updateStatus(statusData);
    
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Get customer stats
    const Customer = (await import('../models/Customer.js')).default;
    const Payment = (await import('../models/Payment.js')).default;
    
    const [customerStats, paymentStats] = await Promise.all([
      Customer.aggregate([
        { $match: { device: device._id } },
        {
          $group: {
            _id: '$connectionStatus',
            count: { $sum: 1 }
          }
        }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            device: device._id,
            status: 'completed',
            createdAt: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            monthlyRevenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        }
      ])
    ]);
    
    // Format customer stats
    const customerStatus = {
      online: 0,
      offline: 0,
      expired: 0,
      disabled: 0
    };
    
    customerStats.forEach(stat => {
      customerStatus[stat._id] = stat.count;
    });
    
    res.json({
      device,
      customerStats: customerStatus,
      paymentStats: {
        monthlyRevenue: paymentStats[0]?.monthlyRevenue || 0,
        transactionCount: paymentStats[0]?.transactionCount || 0,
        totalRevenue: device.stats.totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device dashboard data
router.get('/:id/dashboard', authenticate, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Get recent payments
    const Payment = (await import('../models/Payment.js')).default;
    const Customer = (await import('../models/Customer.js')).default;
    
    const [recentPayments, topCustomers] = await Promise.all([
      Payment.find({ device: device._id })
        .populate('customer', 'macAddress username')
        .populate('package', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Customer.find({ device: device._id, connectionStatus: 'online' })
        .populate('currentPackage.package', 'name')
        .sort({ lastConnection: -1 })
        .limit(10)
    ]);
    
    // Get daily revenue for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          device: device._id,
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.json({
      device,
      stats: {
        onlineCustomers: device.stats.onlineCustomers,
        totalCustomers: device.stats.totalCustomers,
        monthlyRevenue: device.stats.monthlyRevenue,
        health: device.health
      },
      recentPayments,
      onlineCustomers: topCustomers,
      dailyRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;