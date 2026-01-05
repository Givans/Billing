import express from 'express';
import RadiusService from '../services/radiusService.js';
import Customer from '../models/Customer.js';
import Device from '../models/Device.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// RADIUS Authentication endpoint
router.post('/authenticate', async (req, res) => {
  try {
    const response = await RadiusService.handleAuthentication(req.body);
    res.json(response);
  } catch (error) {
    console.error('Authentication endpoint error:', error);
    res.json({
      "control:Auth-Type": "Reject",
      "reply:Reply-Message": "Internal server error"
    });
  }
});

// RADIUS Accounting endpoint
router.post('/accounting', async (req, res) => {
  try {
    const result = await RadiusService.handleAccounting(req.body);
    if (result.success) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Accounting endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get device status
router.get('/device/:deviceId/status', authenticate, async (req, res) => {
  try {
    const device = await Device.findById(req.params.deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Get online customers for this device
    const onlineCustomers = await Customer.countDocuments({
      device: device._id,
      'session.isOnline': true
    });
    
    // Update device online count
    device.stats.onlineCustomers = onlineCustomers;
    await device.save();
    
    res.json({
      device: {
        id: device._id,
        name: device.name,
        nasIp: device.nasIp,
        status: device.status,
        lastSeen: device.lastSeen
      },
      stats: {
        onlineCustomers,
        totalCustomers: device.stats.totalCustomers,
        revenueToday: device.stats.revenueToday,
        revenueMonth: device.stats.revenueMonth
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get online customers for device
router.get('/device/:deviceId/customers/online', authenticate, async (req, res) => {
  try {
    const customers = await Customer.find({
      device: req.params.deviceId,
      'session.isOnline': true
    })
      .populate('currentPackage.package', 'name speed')
      .select('macAddress phoneNumber session currentPackage lastSeen');
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Cleanup expired sessions (cron job endpoint)
router.post('/cleanup', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await RadiusService.cleanupExpiredSessions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Force disconnect customer
router.post('/disconnect', authenticate, async (req, res) => {
  try {
    const { macAddress, deviceId } = req.body;
    
    if (!macAddress || !deviceId) {
      return res.status(400).json({ error: 'MAC address and device ID required' });
    }
    
    const result = await RadiusService.forceDisconnect(macAddress, deviceId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Check customer status
router.get('/customer/:macAddress/status', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      macAddress: req.params.macAddress.toUpperCase()
    })
      .populate('device', 'name nasIp')
      .populate('currentPackage.package', 'name speed duration price');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const hasActiveSubscription = customer.hasActiveSubscription();
    const isOnline = customer.session.isOnline;
    
    res.json({
      customer: {
        macAddress: customer.macAddress,
        phoneNumber: customer.phoneNumber,
        device: customer.device,
        status: customer.status
      },
      session: {
        isOnline,
        startTime: customer.session.startTime,
        ipAddress: customer.session.ipAddress
      },
      package: customer.currentPackage,
      subscription: {
        isActive: hasActiveSubscription,
        expiryDate: customer.currentPackage?.expiryDate,
        dataUsed: customer.currentPackage?.dataUsed || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;