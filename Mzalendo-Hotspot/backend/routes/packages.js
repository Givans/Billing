import express from 'express';
import Package from '../models/Package.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all packages
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, isActive } = req.query;
    
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const packages = await Package.find(query)
      .populate('createdBy', 'username')
      .sort({ price: 1 });
    
    // Add virtuals to response
    const packagesWithVirtuals = packages.map(pkg => ({
      ...pkg.toObject(),
      durationInMinutes: pkg.durationInMinutes,
      durationInMs: pkg.durationInMs,
      formattedDuration: pkg.getFormattedDuration(),
      hasBurst: pkg.hasBurst()
    }));
    
    res.json(packagesWithVirtuals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create package (admin/operator only)
router.post('/', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const {
      name,
      description,
      type = 'hotspot',
      speed = { download: 10, upload: 5 },
      duration,
      price,
      dataLimit = 'unlimited',
      dataAmount = 0,
      burstAllowed = false,
      maxBurstSpeed = 0,
      burstPrice,
      features = [],
      colorCode = '#3498db'
    } = req.body;
    
    // Validate duration
    if (!duration || !duration.value || !duration.unit) {
      return res.status(400).json({ error: 'Duration with value and unit is required' });
    }
    
    // Validate speed
    if (!speed.download || !speed.upload) {
      return res.status(400).json({ error: 'Download and upload speeds are required' });
    }
    
    const packageData = {
      name,
      description,
      type,
      speed,
      duration,
      price,
      dataLimit,
      dataAmount,
      burstAllowed,
      maxBurstSpeed,
      burstPrice,
      features,
      colorCode,
      createdBy: req.user._id
    };
    
    // Validate dataAmount for limited packages
    if (dataLimit === 'limited' && (!dataAmount || dataAmount <= 0)) {
      return res.status(400).json({ error: 'dataAmount is required for limited data packages' });
    }
    
    const newPackage = new Package(packageData);
    await newPackage.save();
    
    // Include virtuals in response
    const response = {
      ...newPackage.toObject(),
      durationInMinutes: newPackage.durationInMinutes,
      durationInMs: newPackage.durationInMs,
      formattedDuration: newPackage.getFormattedDuration(),
      hasBurst: newPackage.hasBurst()
    };
    
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get package by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    const response = {
      ...pkg.toObject(),
      durationInMinutes: pkg.durationInMinutes,
      durationInMs: pkg.durationInMs,
      formattedDuration: pkg.getFormattedDuration(),
      hasBurst: pkg.hasBurst()
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update package
router.put('/:id', authenticate, authorize('admin', 'operator'), async (req, res) => {
  try {
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');
    
    if (!updatedPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    const response = {
      ...updatedPackage.toObject(),
      durationInMinutes: updatedPackage.durationInMinutes,
      durationInMs: updatedPackage.durationInMs,
      formattedDuration: updatedPackage.getFormattedDuration(),
      hasBurst: updatedPackage.hasBurst()
    };
    
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete package (soft delete)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    pkg.isActive = false;
    await pkg.save();
    
    res.json({ 
      message: 'Package deactivated successfully',
      package: pkg 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;