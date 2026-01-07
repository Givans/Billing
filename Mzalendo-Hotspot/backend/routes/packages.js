import express from 'express';
import Package from '../models/Package.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all packages with filters and pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      type, 
      isActive,
      search,
      minPrice,
      maxPrice,
      durationUnit,
      device,
      page = 1,
      limit = 20,
      sortBy = 'price',
      sortOrder = 'asc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    let query = {};
    
    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Duration unit filter
    if (durationUnit && durationUnit !== 'all') {
      query['duration.unit'] = durationUnit;
    }
    
    // Device filter (you might need to join with devices collection)
    if (device && device !== 'all') {
      // This assumes packages are associated with devices
      // You might need to adjust based on your schema
      query.device = device;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Fetch packages with pagination
    const packages = await Package.find(query)
      .populate('createdBy', 'username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add virtuals to response
    const packagesWithVirtuals = packages.map(pkg => ({
      ...pkg.toObject(),
      durationInMinutes: pkg.durationInMinutes,
      durationInMs: pkg.durationInMs,
      formattedDuration: pkg.getFormattedDuration(),
      hasBurst: pkg.hasBurst(),
      // Add customer count for analytics
      customerCount: 0 // We'll populate this later
    }));
    
    const total = await Package.countDocuments(query);
    
    // Get package usage statistics
    const Customer = (await import('../models/Customer.js')).default;
    const packageStats = await Customer.aggregate([
      {
        $group: {
          _id: '$currentPackage.package',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Map customer counts to packages
    const packagesWithStats = packagesWithVirtuals.map(pkg => {
      const stat = packageStats.find(s => s._id && s._id.toString() === pkg._id.toString());
      return {
        ...pkg,
        customerCount: stat ? stat.count : 0
      };
    });
    
    res.json({
      success: true,
      packages: packagesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get package analytics
router.get('/analytics/stats', authenticate, async (req, res) => {
  try {
    const Customer = (await import('../models/Customer.js')).default;
    
    // Get package usage statistics
    const packageStats = await Customer.aggregate([
      {
        $group: {
          _id: '$currentPackage.package',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: 'packages',
          localField: '_id',
          foreignField: '_id',
          as: 'package'
        }
      },
      { $unwind: { path: '$package', preserveNullAndEmptyArrays: true } }
    ]);
    
    // Get total packages and active packages
    const totalPackages = await Package.countDocuments();
    const activePackages = await Package.countDocuments({ isActive: true });
    
    // Calculate revenue per package (simplified)
    const revenueStats = await Promise.all(
      packageStats.slice(0, 5).map(async (stat) => {
        const packageDoc = stat.package;
        const totalRevenue = (packageDoc.price || 0) * stat.count;
        return {
          packageId: packageDoc._id,
          packageName: packageDoc.name,
          customerCount: stat.count,
          totalRevenue
        };
      })
    );
    
    res.json({
      success: true,
      stats: {
        totalPackages,
        activePackages,
        topPackages: packageStats.slice(0, 5),
        leastUsedPackages: packageStats.slice(-5),
        revenueStats
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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