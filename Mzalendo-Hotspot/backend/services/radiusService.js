import Customer from '../models/Customer.js';
import Device from '../models/Device.js';
import Package from '../models/Package.js';
import Session from '../models/Session.js';

class RadiusService {
  // Handle RADIUS authentication
  async handleAuthentication(authData) {
    try {
      const { username, nas_ip } = authData;
      
      console.log(`📡 RADIUS Auth: ${username} @ ${nas_ip}`);
      
      // Validate NAS IP
      if (!this.validateNasIp(nas_ip)) {
        console.log(`❌ Invalid NAS IP: ${nas_ip}`);
        return this.buildRejectResponse('Invalid device');
      }
      
      // Extract MAC from username (hotspot sends MAC as username)
      const macAddress = this.extractMacAddress(username);
      if (!macAddress) {
        console.log(`❌ Invalid MAC format: ${username}`);
        return this.buildRejectResponse('Invalid MAC address');
      }
      
      // Find device by NAS IP
      const device = await Device.findOne({ nasIp: nas_ip });
      if (!device) {
        console.log(`❌ Device not found: ${nas_ip}`);
        return this.buildRejectResponse('Device not authorized');
      }
      
      // Find customer by MAC and device
      const customer = await Customer.findOne({
        macAddress: macAddress,
        device: device._id
      }).populate('currentPackage.package');
      
      // Customer not found - redirect to payment portal
      if (!customer) {
        console.log(`👤 New customer: ${macAddress}`);
        return this.buildCaptivePortalResponse(macAddress, device._id);
      }
      
      // Check customer status
      if (customer.status !== 'active') {
        console.log(`🚫 Customer ${macAddress} is ${customer.status}`);
        return this.buildRejectResponse('Account ' + customer.status);
      }
      
      // Check if package is active
      if (!customer.hasActiveSubscription()) {
        console.log(`⏰ Package expired for ${macAddress}`);
        customer.status = 'expired';
        await customer.save();
        return this.buildCaptivePortalResponse(macAddress, device._id);
      }
      
      // SUCCESS - Active customer with valid package
      console.log(`✅ Active customer: ${macAddress}`);
      
      // Generate session ID
      const sessionId = `HS_${Date.now()}_${macAddress.replace(/:/g, '').slice(-6)}`;
      
      // Update customer session
      await this.updateCustomerSession(customer, true, {
        sessionId: sessionId,
        ipAddress: authData.framed_ip,
        nasIp: nas_ip
      });
      
      // Update device online count
      await this.updateDeviceOnlineCount(device._id, 1);
      
      // Create session record
      await this.createSessionRecord({
        customer: customer._id,
        device: device._id,
        sessionId: sessionId,
        username: username,
        ipAddress: authData.framed_ip,
        nasIp: nas_ip
      });
      
      // Build success response with speed limits
      return this.buildSuccessResponse(customer, sessionId);
      
    } catch (error) {
      console.error('RADIUS auth error:', error);
      return this.buildRejectResponse('Internal server error');
    }
  }
  
  // Handle RADIUS accounting
  async handleAccounting(acctData) {
    try {
      const { username, acct_status_type, nas_ip_address, input_octets, output_octets, session_time } = acctData;
      
      // Extract MAC from username
      const macAddress = this.extractMacAddress(username);
      if (!macAddress) return { success: false, error: 'Invalid MAC' };
      
      // Find device
      const device = await Device.findOne({ nasIp: nas_ip_address });
      if (!device) return { success: false, error: 'Device not found' };
      
      // Find customer
      const customer = await Customer.findOne({
        macAddress: macAddress,
        device: device._id
      });
      
      if (!customer) return { success: false, error: 'Customer not found' };
      
      switch (acct_status_type) {
        case 'Start':
          // Already handled in authentication
          break;
          
        case 'Interim-Update':
          // Update data usage
          await this.updateDataUsage(customer, input_octets, output_octets);
          break;
          
        case 'Stop':
          // Update customer to offline
          await this.updateCustomerSession(customer, false);
          
          // Update device online count
          await this.updateDeviceOnlineCount(device._id, -1);
          
          // Update session with stop time and data
          await Session.findOneAndUpdate(
            { sessionId: customer.session.sessionId },
            {
              stopTime: new Date(),
              'data.download': parseInt(input_octets || 0),
              'data.upload': parseInt(output_octets || 0)
            }
          );
          
          console.log(`🔴 Session stopped: ${macAddress}`);
          break;
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('RADIUS accounting error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Helper methods
  validateNasIp(nasIp) {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(nasIp);
  }
  
  extractMacAddress(username) {
    // Handles formats: "AA:BB:CC:DD:EE:FF" or "AA:BB:CC:DD:EE:FF|DeviceName"
    const macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/;
    const match = username.match(macRegex);
    if (!match) return null;
    
    return match[0].toUpperCase().replace(/[^A-F0-9]/g, '');
  }
  
  async updateCustomerSession(customer, isOnline, sessionData = {}) {
    customer.session.isOnline = isOnline;
    customer.lastSeen = new Date();
    
    if (isOnline) {
      customer.totalConnections += 1;
      customer.session.sessionId = sessionData.sessionId || customer.session.sessionId;
      customer.session.startTime = sessionData.startTime || new Date();
      customer.session.ipAddress = sessionData.ipAddress || customer.session.ipAddress;
      customer.session.nasIp = sessionData.nasIp || customer.session.nasIp;
    } else {
      customer.session.sessionId = null;
      customer.session.startTime = null;
      customer.session.ipAddress = null;
    }
    
    await customer.save();
  }
  
  async updateDeviceOnlineCount(deviceId, increment) {
    await Device.findByIdAndUpdate(deviceId, {
      $inc: { 'stats.onlineCustomers': increment },
      status: 'online',
      lastSeen: new Date()
    });
  }
  
  async createSessionRecord(sessionData) {
    await Session.create({
      ...sessionData,
      startTime: new Date()
    });
  }
  
  async updateDataUsage(customer, downloadBytes, uploadBytes) {
    if (!customer.currentPackage) return;
    
    customer.currentPackage.dataUsed += (parseInt(downloadBytes || 0) + parseInt(uploadBytes || 0));
    await customer.save();
  }
  
  buildCaptivePortalResponse(macAddress, deviceId) {
    const portalUrl = process.env.PORTAL_URL || 'http://10.200.200.250:3000';
    const redirectUrl = `${portalUrl}/hotspot/login?mac=${encodeURIComponent(macAddress)}&device=${deviceId}`;
    
    return {
      "control:Auth-Type": "Accept",
      "reply:Reply-Message": "Please purchase a package to connect",
      "reply:Session-Timeout": "1800", // 30 minutes
      "reply:Idle-Timeout": "300", // 5 minutes
      "reply:Mikrotik-Rate-Limit": "1M/1M",
      "reply:Redirect-URL": redirectUrl
    };
  }
  
  buildSuccessResponse(customer, sessionId) {
    const packageDoc = customer.currentPackage?.package;
    const downloadSpeed = packageDoc?.speed?.download || 10;
    const uploadSpeed = packageDoc?.speed?.upload || 5;
    
    // Calculate session timeout based on package expiry
    let sessionTimeout = 86400; // Default 24 hours
    
    if (customer.currentPackage?.expiryDate) {
      const expiry = new Date(customer.currentPackage.expiryDate);
      const now = new Date();
      const secondsRemaining = Math.floor((expiry - now) / 1000);
      sessionTimeout = Math.max(300, secondsRemaining); // Minimum 5 minutes
    }
    
    return {
      "control:Auth-Type": "Accept",
      "reply:Reply-Message": "Access granted",
      "reply:Session-Timeout": sessionTimeout.toString(),
      "reply:Idle-Timeout": "1800", // 30 minutes idle timeout
      "reply:Mikrotik-Rate-Limit": `${downloadSpeed}M/${uploadSpeed}M`,
      "reply:Acct-Session-Id": sessionId
    };
  }
  
  buildRejectResponse(message) {
    return {
      "control:Auth-Type": "Reject",
      "reply:Reply-Message": message
    };
  }
  
  // Check and remove expired users from active sessions
  async cleanupExpiredSessions() {
    try {
      console.log('🔄 Checking for expired sessions...');
      
      const now = new Date();
      
      // Find customers with expired packages but still marked online
      const expiredCustomers = await Customer.find({
        'session.isOnline': true,
        'currentPackage.expiryDate': { $lt: now },
        status: 'active'
      }).populate('device');
      
      let removedCount = 0;
      
      for (const customer of expiredCustomers) {
        console.log(`⏰ Removing expired customer: ${customer.macAddress}`);
        
        // Mark customer as expired and offline
        customer.status = 'expired';
        await this.updateCustomerSession(customer, false);
        
        // Update device stats
        if (customer.device) {
          await this.updateDeviceOnlineCount(customer.device._id, -1);
        }
        
        removedCount++;
      }
      
      if (removedCount > 0) {
        console.log(`✅ Removed ${removedCount} expired customers from active sessions`);
      }
      
      return { removed: removedCount };
      
    } catch (error) {
      console.error('Cleanup error:', error);
      return { error: error.message };
    }
  }
  
  // Force disconnect a user
  async forceDisconnect(macAddress, deviceId) {
    try {
      const customer = await Customer.findOne({
        macAddress: macAddress,
        device: deviceId,
        'session.isOnline': true
      });
      
      if (!customer) {
        return { success: false, error: 'Customer not found or not online' };
      }
      
      // Mark as offline
      await this.updateCustomerSession(customer, false);
      
      // Update device stats
      await this.updateDeviceOnlineCount(deviceId, -1);
      
      return { success: true, message: 'User disconnected' };
      
    } catch (error) {
      console.error('Force disconnect error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get device statistics
  async getDeviceStats(deviceId) {
    try {
      const device = await Device.findById(deviceId);
      if (!device) {
        return { error: 'Device not found' };
      }
      
      // Get online customers count
      const onlineCustomers = await Customer.countDocuments({
        device: deviceId,
        'session.isOnline': true
      });
      
      // Update device stats
      device.stats.onlineCustomers = onlineCustomers;
      await device.save();
      
      return {
        device: {
          id: device._id,
          name: device.name,
          nasIp: device.nasIp,
          status: device.status,
          lastSeen: device.lastSeen
        },
        stats: device.stats
      };
      
    } catch (error) {
      console.error('Get device stats error:', error);
      return { error: error.message };
    }
  }
}

export default new RadiusService();