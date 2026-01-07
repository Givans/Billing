// components/packages/PackageFormModal.tsx
import { useState, useEffect } from "react";
import { FiSave, FiHelpCircle, FiCheckCircle, FiAlertCircle, FiLoader, FiPackage } from "react-icons/fi";
import { Modal } from "../ui/modal";

interface PackageFormModalProps {
  packageData?: any;
  onSubmit: (formData: any) => Promise<void>; // Change to async
  onClose: () => void;
}

export default function PackageFormModal({ packageData, onSubmit, onClose }: PackageFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "hotspot",
    speed: {
      download: 10,
      upload: 5
    },
    duration: {
      value: 1,
      unit: "days"
    },
    price: 0,
    dataLimit: "unlimited",
    dataAmount: 0,
    burstAllowed: false,
    maxBurstSpeed: 0,
    burstPrice: 0,
    features: [] as string[],
    colorCode: "#3498db",
    isActive: true
  });

  const [featureInput, setFeatureInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (packageData) {
      setFormData({
        name: packageData.name || "",
        description: packageData.description || "",
        type: packageData.type || "hotspot",
        speed: packageData.speed || { download: 10, upload: 5 },
        duration: packageData.duration || { value: 1, unit: "days" },
        price: packageData.price || 0,
        dataLimit: packageData.dataLimit || "unlimited",
        dataAmount: packageData.dataAmount || 0,
        burstAllowed: packageData.burstAllowed || false,
        maxBurstSpeed: packageData.maxBurstSpeed || 0,
        burstPrice: packageData.burstPrice || 0,
        features: packageData.features || [],
        colorCode: packageData.colorCode || "#3498db",
        isActive: packageData.isActive !== undefined ? packageData.isActive : true
      });
    }
  }, [packageData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(formData);
      setSuccess(true);
      
      // Show success message for 2 seconds, then close
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "Failed to save package");
    } finally {
      setLoading(false);
    }
  };

  const durationUnits = [
    { value: "minutes", label: "Minutes" },
    { value: "hours", label: "Hours" },
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
    { value: "months", label: "Months" }
  ];

  const packageTypes = [
    { value: "hotspot", label: "Hotspot" },
    { value: "wifi", label: "WiFi" },
    { value: "dedicated", label: "Dedicated" },
    { value: "corporate", label: "Corporate" }
  ];

  const dataLimitOptions = [
    { value: "unlimited", label: "Unlimited" },
    { value: "limited", label: "Limited" }
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      className="max-w-4xl"
    >
      {/* Status Indicators */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50 rounded-3xl">
          <div className="text-center">
            <FiLoader className="size-12 text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300">
              {packageData ? "Updating package..." : "Creating package..."}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50 rounded-3xl">
          <div className="text-center">
            <FiCheckCircle className="size-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
              {packageData ? "Package updated successfully!" : "Package created successfully!"}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Closing in 2 seconds...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-800 rounded-t-3xl">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {packageData ? "Edit Package" : "Create New Package"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure internet package details
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-33 p-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="text-red-500 size-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-300 font-medium">Error</p>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Premium 24hr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Package description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Package Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {packageTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="colorCode"
                    value={formData.colorCode}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-12 h-12 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    name="colorCode"
                    value={formData.colorCode}
                    onChange={handleChange}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Speed & Duration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Speed & Duration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Download Speed (Mbps) *
                </label>
                <input
                  type="number"
                  name="speed.download"
                  value={formData.speed.download}
                  onChange={handleChange}
                  required
                  min="1"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Speed (Mbps) *
                </label>
                <input
                  type="number"
                  name="speed.upload"
                  value={formData.speed.upload}
                  onChange={handleChange}
                  required
                  min="1"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration Value *
                </label>
                <input
                  type="number"
                  name="duration.value"
                  value={formData.duration.value}
                  onChange={handleChange}
                  required
                  min="1"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration Unit *
                </label>
                <select
                  name="duration.unit"
                  value={formData.duration.unit}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {durationUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data & Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Data & Pricing</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Limit
              </label>
              <select
                name="dataLimit"
                value={formData.dataLimit}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dataLimitOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.dataLimit === "limited" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Amount (GB) *
                </label>
                <input
                  type="number"
                  name="dataAmount"
                  value={formData.dataAmount}
                  onChange={handleChange}
                  required={formData.dataLimit === "limited"}
                  min="1"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (KES) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Burst Settings & Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Advanced Settings</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="burstAllowed"
                name="burstAllowed"
                checked={formData.burstAllowed}
                onChange={handleChange}
                disabled={loading}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50"
              />
              <label htmlFor="burstAllowed" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Burst Speed
              </label>
              <FiHelpCircle className="text-gray-400 size-4" title="Allow customers to burst beyond normal speed limits" />
            </div>

            {formData.burstAllowed && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Burst Speed (Mbps)
                  </label>
                  <input
                    type="number"
                    name="maxBurstSpeed"
                    value={formData.maxBurstSpeed}
                    onChange={handleChange}
                    min="0"
                    disabled={loading}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Burst Price (KES)
                  </label>
                  <input
                    type="number"
                    name="burstPrice"
                    value={formData.burstPrice}
                    onChange={handleChange}
                    min="0"
                    disabled={loading}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Features
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Add a feature..."
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    <span className="text-sm">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      disabled={loading}
                      className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                disabled={loading}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Package
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Package Preview</h3>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.colorCode }}
            >
              <FiPackage className="text-white size-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{formData.name || "Package Name"}</h4>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {formData.speed.download}/{formData.speed.upload} Mbps
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formData.duration.value} {formData.duration.unit}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formData.dataLimit === "unlimited" ? "Unlimited" : `${formData.dataAmount} GB`}
                </span>
                <span className="font-bold text-gray-800 dark:text-white/90">
                  KES {formData.price}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FiLoader className="size-4 animate-spin" />
                {packageData ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <FiSave className="size-4" />
                {packageData ? "Update Package" : "Create Package"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}