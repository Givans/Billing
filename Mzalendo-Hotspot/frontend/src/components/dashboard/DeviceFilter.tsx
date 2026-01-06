// components/dashboard/DeviceFilter.tsx
import { useState, useEffect } from "react";
import { FiServer, FiChevronDown } from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

interface DeviceFilterProps {
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
}

export default function DeviceFilter({ selectedDevice, onDeviceChange }: DeviceFilterProps) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/devices`);
      const data = await res.json();
      setDevices(data);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (deviceId: string) => {
    onDeviceChange(deviceId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 min-w-[180px]"
      >
        <FiServer className="size-4" />
        <span className="flex-1 text-left">
          {selectedDevice === "all" 
            ? "All Devices" 
            : devices.find(d => d._id === selectedDevice)?.name || "Select Device"
          }
        </span>
        <FiChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
          <div className="py-2">
            <button
              onClick={() => handleSelect("all")}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                selectedDevice === "all" ? "bg-gray-100 dark:bg-gray-700" : ""
              }`}
            >
              All Devices
            </button>
            
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
            ) : (
              devices.map((device) => (
                <button
                  key={device._id}
                  onClick={() => handleSelect(device._id)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedDevice === device._id ? "bg-gray-100 dark:bg-gray-700" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span>{device.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}