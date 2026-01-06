import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import authRoutes from './routes/auth.js';
import packageRoutes from './routes/packages.js';
import customerRoutes from './routes/customers.js';
import paymentRoutes from './routes/payments.js';
import voucherRoutes from './routes/vouchers.js';
import deviceRoutes from './routes/devices.js';
import radiusRoutes from './routes/radius.js';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database connection for MongoDB Atlas
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      console.log('Please create a .env file with your MongoDB Atlas connection string');
      return;
    }
    
    // For MongoDB Atlas, we need to use newer options
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('📊 MongoDB connected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
    console.log('\n🔧 Troubleshooting Atlas connection:');
    console.log('1. Check your internet connection');
    console.log('2. Verify your MongoDB Atlas credentials');
    console.log('3. Make sure your IP is whitelisted in Atlas:');
    console.log('   - Go to Network Access in Atlas dashboard');
    console.log('   - Click "Add IP Address"');
    console.log('   - Add "0.0.0.0/0" to allow all IPs (for development)');
    console.log('4. Check if your cluster is paused (free tier auto-pauses)');
    console.log('5. Visit: https://cloud.mongodb.com to check cluster status');
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/radius', radiusRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hotspot Billing System API',
    status: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongodb: 'Atlas',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  const health = {
    status: mongoose.connection.readyState === 1 ? 'OK' : 'WARNING',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongodb: 'Atlas',
    env: process.env.NODE_ENV || 'development'
  };
  
  if (mongoose.connection.readyState !== 1) {
    health.message = 'Database not connected';
    health.troubleshooting = 'Check Atlas dashboard and IP whitelist';
  }
  
  res.json(health);
});

// Simple test route that doesn't require DB
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: MongoDB Atlas`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  mongoose.connection.close();
  process.exit(0);
});

export default app;