// middleware/auth.js - UPDATED
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .populate('role')
      .populate('customPermissions');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware - checks specific permission
export const authorize = (module, action) => {
  return async (req, res, next) => {
    try {
      // Super admin bypasses all checks
      if (req.user.role.name === 'super_admin') {
        return next();
      }
      
      const hasPermission = await req.user.hasPermission(module, action);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Insufficient permissions. Required: ${module}:${action}` 
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// Check multiple permissions (any of them)
export const authorizeAny = (permissions) => {
  return async (req, res, next) => {
    try {
      if (req.user.role.name === 'super_admin') {
        return next();
      }
      
      for (const perm of permissions) {
        const [module, action] = perm.split(':');
        const hasPermission = await req.user.hasPermission(module, action);
        
        if (hasPermission) {
          return next();
        }
      }
      
      return res.status(403).json({ 
        error: 'Insufficient permissions' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// Check all permissions
export const authorizeAll = (permissions) => {
  return async (req, res, next) => {
    try {
      if (req.user.role.name === 'super_admin') {
        return next();
      }
      
      for (const perm of permissions) {
        const [module, action] = perm.split(':');
        const hasPermission = await req.user.hasPermission(module, action);
        
        if (!hasPermission) {
          return res.status(403).json({ 
            error: `Missing permission: ${module}:${action}` 
          });
        }
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};