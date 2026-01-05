import express from 'express';
import Customer from '../models/Customer.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to hash phone number
const hashPhone = (phone) => {
  if (!phone) return null;
  return crypto.createHash('sha256').update(phone).digest('hex');
};

// Get all customers
router.get('/', authenticate, checkPermission('canViewCustomers'), async (req, res) => {
  try {
    const { search, isActive } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { macAddress: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const customers = await Customer.find(query)
      .populate('currentPackage.package')
      .sort({ createdAt: -1 });
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer by MAC
router.get('/mac/:mac', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findOne({ 
      macAddress: req.params.mac.toUpperCase() 
    }).populate('currentPackage.package');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/', authenticate, checkPermission('canEditCustomers'), async (req, res) => {
  try {
    const { macAddress, phoneNumber, ...otherData } = req.body;
    
    // Check if customer exists
    const existing = await Customer.findOne({ 
      macAddress: macAddress.toUpperCase() 
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Customer already exists' });
    }
    
    const customerData = {
      macAddress: macAddress.toUpperCase(),
      hashedPhone: phoneNumber ? hashPhone(phoneNumber) : null,
      createdBy: req.user._id,
      ...otherData
    };
    
    const customer = new Customer(customerData);
    await customer.save();
    
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', authenticate, checkPermission('canEditCustomers'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Update hashed phone if phone number changed
    if (req.body.phoneNumber && req.body.phoneNumber !== customer.phoneNumber) {
      req.body.hashedPhone = hashPhone(req.body.phoneNumber);
    }
    
    Object.assign(customer, req.body);
    await customer.save();
    
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update customer package
router.post('/:id/package', authenticate, async (req, res) => {
  try {
    const { packageId, expiryDate } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    customer.currentPackage = {
      package: packageId,
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      dataUsed: 0
    };
    
    customer.isActive = true;
    await customer.save();
    
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check customer status
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('currentPackage.package');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const hasActiveSubscription = customer.hasActiveSubscription();
    
    res.json({
      isActive: customer.isActive,
      hasActiveSubscription,
      currentPackage: customer.currentPackage,
      expiryDate: customer.currentPackage?.expiryDate,
      dataUsed: customer.currentPackage?.dataUsed || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;