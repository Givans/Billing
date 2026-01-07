// components/devices/AddDeviceModal.tsx
import { useState, useEffect } from "react";
import { FiSave, FiRefreshCw } from "react-icons/fi";
import { Modal } from "../ui/modal";

const API_URL = "http://localhost:5000/api";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdded: () => void;
}

export default function AddDeviceModal({ 
  isOpen, 
  onClose, 
  onDeviceAdded 
}: AddDeviceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    nasIp: "10.70.70.1",
    location: "",
    secret: "",
    status: "offline"
  });
  const [loading, setLoading] = useState(false);
  const [fetchingIP, setFetchingIP] = useState(false);
  const [error, setError] = useState("");
  const [generatingSecret, setGeneratingSecret] = useState(false);

  // Fetch existing devices to calculate next NAS IP
  useEffect(() => {
    if (isOpen) {
      calculateNextNASIP();
    }
  }, [isOpen]);

  const calculateNextNASIP = async () => {
    try {
      setFetchingIP(true);
      const res = await fetch(`${API_URL}/devices`);
      const result = await res.json();
      
      let nextIP = "10.70.70.1"; // Default if no devices
      
      if (result.success && result.data?.devices?.length > 0) {
        // Get all NAS IPs and find the highest last digit
        const devices = result.data.devices;
        const nasIPs = devices.map((d: any) => d.nasIp);
        
        // Filter IPs that match the 10.70.70.x pattern
        const matchingIPs = nasIPs.filter((ip: string) => 
          ip.startsWith("10.70.70.")
        );
        
        if (matchingIPs.length > 0) {
          // Find the highest last octet
          const lastOctets = matchingIPs.map((ip: string) => {
            const parts = ip.split('.');
            return parseInt(parts[3] || "0");
          });
          
          const maxLastOctet = Math.max(...lastOctets);
          nextIP = `10.70.70.${maxLastOctet + 1}`;
        }
      }
      
      setFormData(prev => ({ ...prev, nasIp: nextIP }));
    } catch (error) {
      console.error("Error calculating next NAS IP:", error);
      // Keep default IP if error occurs
      setFormData(prev => ({ ...prev, nasIp: "10.70.70.1" }));
    } finally {
      setFetchingIP(false);
    }
  };

  const generateRandomSecret = () => {
    setGeneratingSecret(true);
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData(prev => ({ ...prev, secret: result }));
    setTimeout(() => setGeneratingSecret(false), 500);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Device name is required");
      return false;
    }
    if (!formData.nasIp.trim()) {
      setError("NAS IP address is required");
      return false;
    }
    if (!formData.secret.trim()) {
      setError("Secret key is required");
      return false;
    }
    
    // Validate IP address format
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(formData.nasIp)) {
      setError("Please enter a valid IP address");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          status: "offline" // Always set to offline initially
        })
      });

      const data = await res.json();

      if (res.ok) {
        onDeviceAdded();
        // Reset form
        setFormData({
          name: "",
          nasIp: "10.70.70.1",
          location: "",
          secret: "",
          status: "offline"
        });
      } else {
        setError(data.error || "Failed to add device");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Add New Device
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure a new MikroTik hotspot device
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., MikroTik-Router-01"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              required
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              A descriptive name for this device
            </p>
          </div>

          {/* NAS IP Address - Auto-generated and read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              NAS IP Address *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="nasIp"
                value={formData.nasIp}
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
              {fetchingIP && (
                <div className="text-xs text-gray-500">
                  Calculating...
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Auto-generated based on existing devices
            </p>
            <p className="mt-1 text-xs text-blue-500 dark:text-blue-400">
              Pattern: 10.70.70.x (Next available: {formData.nasIp})
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Secret Key *
              </label>
              <button
                type="button"
                onClick={generateRandomSecret}
                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1"
              >
                <FiRefreshCw className={`size-3 ${generatingSecret ? 'animate-spin' : ''}`} />
                Generate Random
              </button>
            </div>
            <input
              type="text"
              name="secret"
              value={formData.secret}
              onChange={handleChange}
              placeholder="Enter secret key or generate one"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 font-mono text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              32-character key for RADIUS authentication
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location (Optional)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Main Office, Reception Area"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Physical location of the device
            </p>
          </div>

          {/* Device status is always offline initially - hidden from user */}
          <input type="hidden" name="status" value="offline" />
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <FiSave className="size-4" />
                Add Device
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}