import cron from 'node-cron';
import RadiusService from './radiusService.js';

class CronService {
  start() {
    console.log('⏰ Starting cron jobs...');
    
    // Every 5 minutes: Cleanup expired sessions
    cron.schedule('*/5 * * * *', async () => {
      console.log('🔄 Running expired session cleanup...');
      await RadiusService.cleanupExpiredSessions();
    });
    
    // Every hour: Update device statuses
    cron.schedule('0 * * * *', async () => {
      console.log('📊 Updating device statuses...');
      await this.updateDeviceStatuses();
    });
    
    // Daily at midnight: Reset daily stats
    cron.schedule('0 0 * * *', async () => {
      console.log('📅 Resetting daily stats...');
      await this.resetDailyStats();
    });
  }
  
  async updateDeviceStatuses() {
    try {
      const Device = (await import('../models/Device.js')).default;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const devices = await Device.find({
        lastSeen: { $lt: fiveMinutesAgo },
        status: 'online'
      });
      
      for (const device of devices) {
        device.status = 'offline';
        await device.save();
        console.log(`📡 Device ${device.name} marked as offline`);
      }
    } catch (error) {
      console.error('Device status update error:', error);
    }
  }
  
  async resetDailyStats() {
    try {
      const Device = (await import('../models/Device.js')).default;
      
      await Device.updateMany(
        {},
        { $set: { 'stats.revenueToday': 0 } }
      );
      
      console.log('✅ Daily stats reset');
    } catch (error) {
      console.error('Reset daily stats error:', error);
    }
  }
}

export default new CronService();