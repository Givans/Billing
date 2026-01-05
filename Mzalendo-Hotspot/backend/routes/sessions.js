import express from 'express';
import Session from '../models/Session.js';
import Customer from '../models/Customer.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Start session
router.post('/start', async (req, res) => {
  try {
    const { macAddress, ipAddress, deviceInfo } = req.body;
    
    // Find customer
    const customer = await Customer.findOne({ 
      macAddress: macAddress.toUpperCase() 
    }).populate('currentPackage.package');
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }
    
    // Check if customer has active subscription
    if (!customer.hasActiveSubscription()) {
      return res.status(403).json({ 
        error: 'No active subscription',
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }
    
    // Check if data limit exceeded
    if (customer.currentPackage.package.dataLimit > 0) {
      const dataUsedGB = customer.currentPackage.dataUsed / (1024 * 1024 * 1024);
      if (dataUsedGB >= customer.currentPackage.package.dataLimit) {
        return res.status(403).json({ 
          error: 'Data limit exceeded',
          code: 'DATA_LIMIT_EXCEEDED'
        });
      }
    }
    
    // Create session
    const session = new Session({
      customer: customer._id,
      sessionId: `SESS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ipAddress,
      macAddress: customer.macAddress,
      deviceInfo
    });
    
    await session.save();
    
    res.json({
      sessionId: session.sessionId,
      customer: {
        macAddress: customer.macAddress,
        currentPackage: customer.currentPackage
      },
      limits: {
        uploadLimit: customer.currentPackage.package.uploadLimit,
        downloadLimit: customer.currentPackage.package.downloadLimit,
        dataLimit: customer.currentPackage.package.dataLimit,
        dataUsed: customer.currentPackage.dataUsed
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update session (data usage)
router.post('/:sessionId/update', async (req, res) => {
  try {
    const { uploadBytes, downloadBytes } = req.body;
    
    const session = await Session.findOne({ 
      sessionId: req.params.sessionId 
    }).populate('customer');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update session data
    session.uploadBytes += uploadBytes || 0;
    session.downloadBytes += downloadBytes || 0;
    await session.save();
    
    // Update customer data usage
    const customer = session.customer;
    if (customer.currentPackage) {
      customer.currentPackage.dataUsed += (uploadBytes + downloadBytes);
      await customer.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End session
router.post('/:sessionId/end', async (req, res) => {
  try {
    const session = await Session.findOne({ 
      sessionId: req.params.sessionId 
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    session.endTime = new Date();
    session.terminatedBy = req.body.terminatedBy || 'system';
    await session.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer sessions
router.get('/customer/:customerId', authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const sessions = await Session.find({ 
      customer: req.params.customerId 
    })
    .sort({ startTime: -1 })
    .limit(parseInt(limit));
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;