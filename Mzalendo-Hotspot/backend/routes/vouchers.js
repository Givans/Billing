import express from 'express';
import Voucher from '../models/Voucher.js';
import Package from '../models/Package.js';
import Customer from '../models/Customer.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Generate vouchers
router.post('/generate', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const { packageId, value, quantity, expiresAt, notes } = req.body;
    
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    const vouchers = [];
    
    for (let i = 0; i < quantity; i++) {
      const voucher = new Voucher({
        package: packageId,
        value,
        expiresAt,
        createdBy: req.user._id,
        notes
      });
      
      await voucher.save();
      vouchers.push(voucher);
    }
    
    res.status(201).json(vouchers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all vouchers
router.get('/', authenticate, async (req, res) => {
  try {
    const { isUsed } = req.query;
    
    let query = {};
    if (isUsed !== undefined) {
      query.isUsed = isUsed === 'true';
    }
    
    const vouchers = await Voucher.find(query)
      .populate('package', 'name price duration')
      .populate('usedBy', 'macAddress username')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redeem voucher
router.post('/redeem', authenticate, async (req, res) => {
  try {
    const { code, customerId } = req.body;
    
    const voucher = await Voucher.findOne({ 
      code: code.toUpperCase(),
      isUsed: false 
    }).populate('package');
    
    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found or already used' });
    }
    
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      return res.status(400).json({ error: 'Voucher has expired' });
    }
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Mark voucher as used
    voucher.isUsed = true;
    voucher.usedBy = customerId;
    voucher.usedAt = new Date();
    await voucher.save();
    
    // Update customer package
    customer.currentPackage = {
      package: voucher.package._id,
      expiryDate: new Date(Date.now() + voucher.package.durationInMinutes * 60 * 1000),
      uploadLimit: voucher.package.uploadLimit,
      downloadLimit: voucher.package.downloadLimit,
      dataUsed: 0
    };
    
    customer.isActive = true;
    await customer.save();
    
    res.json({
      message: 'Voucher redeemed successfully',
      voucher,
      customer
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;