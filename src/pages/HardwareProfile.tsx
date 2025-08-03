import React, { useState } from "react";
import {
  submitHardwareSpecs,
  autoDetectHardware,
  HardwareProfileData,
} from "../api/hardware";

// Hardware tier options for testing
const HARDWARE_TIERS = [
  { value: "ultra_low", label: "Ultra Low Performance" },
  { value: "low", label: "Low Performance" },
  { value: "medium", label: "Medium Performance" },
  { value: "high", label: "High Performance" },
  { value: "ultra_high", label: "Ultra High Performance" },
  { value: "elite", label: "Elite Performance" },
];

// CPU models for testing
const CPU_MODELS = [
  "Intel Core i3-12100",
  "Intel Core i5-12400",
  "Intel Core i7-12700",
  "Intel Core i9-12900",
  "AMD Ryzen 3 4100",
  "AMD Ryzen 5 5600",
  "AMD Ryzen 7 5800",
  "AMD Ryzen 9 5900",
];

// GPU models for testing
const GPU_MODELS = [
  "NVIDIA GTX 1650",
  "NVIDIA GTX 1660",
  "NVIDIA RTX 3060",
  "NVIDIA RTX 3070",
  "NVIDIA RTX 3080",
  "NVIDIA RTX 3090",
  "AMD RX 5500",
  "AMD RX 5600",
  "AMD RX 6600",
  "AMD RX 6700",
  "AMD RX 6800",
  "AMD RX 6900",
];

// Storage types
const STORAGE_TYPES = [
  { value: "hdd", label: "Hard Disk Drive (HDD)" },
  { value: "ssd", label: "Solid State Drive (SSD)" },
  { value: "nvme", label: "NVMe SSD" },
];

// Connection types
const CONNECTION_TYPES = [
  { value: "wifi", label: "WiFi" },
  { value: "ethernet", label: "Ethernet" },
  { value: "mobile", label: "Mobile Data" },
];

interface HardwareFormData {
  // CPU Information
  cpuModel: string;
  cpuCores: number;
  cpuThreads: number;
  cpuFrequency: number;
  cpuBenchmarkScore: number;

  // GPU Information
  gpuModel: string;
  gpuMemory: number;
  gpuBenchmarkScore: number;

  // RAM Information
  ramTotal: number;
  ramSpeed: number;

  // Storage Information
  storageType: string;
  storageSize: number;

  // Network Information
  connectionType: string;
  connectionSpeed: number;
  ping: number;
  packetLoss: number;

  // Performance Metrics
  fpsAverage: number;
  fpsMin: number;
  fpsMax: number;

  // Manual Override
  tier?: string;
  tierScore?: number;
}

const HardwareProfile: React.FC = () => {
  const [formData, setFormData] = useState<HardwareFormData>({
    // CPU defaults
    cpuModel: CPU_MODELS[1],
    cpuCores: 6,
    cpuThreads: 12,
    cpuFrequency: 3.2,
    cpuBenchmarkScore: 12000,

    // GPU defaults
    gpuModel: GPU_MODELS[2],
    gpuMemory: 8,
    gpuBenchmarkScore: 8000,

    // RAM defaults
    ramTotal: 16,
    ramSpeed: 3200,

    // Storage defaults
    storageType: "ssd",
    storageSize: 512,

    // Network defaults
    connectionType: "ethernet",
    connectionSpeed: 100,
    ping: 25,
    packetLoss: 0.1,

    // Performance defaults
    fpsAverage: 120,
    fpsMin: 60,
    fpsMax: 200,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleInputChange = (
    field: keyof HardwareFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Debug log for easier debugging
      console.log("Submitting hardware profile:", formData);

      const response = await submitHardwareSpecs(
        formData as HardwareProfileData
      );

      console.log("Hardware profile saved successfully:", response);
      setMessage({
        type: "success",
        text: "Hardware profile saved successfully!",
      });
    } catch (error) {
      console.error("Error saving hardware profile:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Failed to save hardware profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      console.log("Attempting auto-detection of hardware...");

      const response = await autoDetectHardware();

      console.log("Auto-detection result:", response);
      setMessage({
        type: "success",
        text: "Hardware auto-detected and saved!",
      });

      // Optionally update form with detected values
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (error) {
      console.error("Error during auto-detection:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Auto-detection failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Hardware Profile
          </h1>

          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CPU Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                CPU Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPU Model
                  </label>
                  <select
                    value={formData.cpuModel}
                    onChange={(e) =>
                      handleInputChange("cpuModel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CPU_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPU Cores
                  </label>
                  <input
                    type="number"
                    value={formData.cpuCores}
                    onChange={(e) =>
                      handleInputChange("cpuCores", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="64"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPU Threads
                  </label>
                  <input
                    type="number"
                    value={formData.cpuThreads}
                    onChange={(e) =>
                      handleInputChange("cpuThreads", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="128"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPU Frequency (GHz)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.cpuFrequency}
                    onChange={(e) =>
                      handleInputChange(
                        "cpuFrequency",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPU Benchmark Score
                  </label>
                  <input
                    type="number"
                    value={formData.cpuBenchmarkScore}
                    onChange={(e) =>
                      handleInputChange(
                        "cpuBenchmarkScore",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1000"
                    max="50000"
                  />
                </div>
              </div>
            </div>

            {/* GPU Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                GPU Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPU Model
                  </label>
                  <select
                    value={formData.gpuModel}
                    onChange={(e) =>
                      handleInputChange("gpuModel", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {GPU_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPU Memory (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.gpuMemory}
                    onChange={(e) =>
                      handleInputChange("gpuMemory", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPU Benchmark Score
                  </label>
                  <input
                    type="number"
                    value={formData.gpuBenchmarkScore}
                    onChange={(e) =>
                      handleInputChange(
                        "gpuBenchmarkScore",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1000"
                    max="30000"
                  />
                </div>
              </div>
            </div>

            {/* RAM Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                RAM Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total RAM (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.ramTotal}
                    onChange={(e) =>
                      handleInputChange("ramTotal", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="4"
                    max="128"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RAM Speed (MHz)
                  </label>
                  <input
                    type="number"
                    value={formData.ramSpeed}
                    onChange={(e) =>
                      handleInputChange("ramSpeed", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1600"
                    max="6400"
                    step="200"
                  />
                </div>
              </div>
            </div>

            {/* Storage Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Storage Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Type
                  </label>
                  <select
                    value={formData.storageType}
                    onChange={(e) =>
                      handleInputChange("storageType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STORAGE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Size (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.storageSize}
                    onChange={(e) =>
                      handleInputChange("storageSize", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="128"
                    max="4000"
                    step="128"
                  />
                </div>
              </div>
            </div>

            {/* Network Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Network Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connection Type
                  </label>
                  <select
                    value={formData.connectionType}
                    onChange={(e) =>
                      handleInputChange("connectionType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CONNECTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connection Speed (Mbps)
                  </label>
                  <input
                    type="number"
                    value={formData.connectionSpeed}
                    onChange={(e) =>
                      handleInputChange(
                        "connectionSpeed",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ping (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.ping}
                    onChange={(e) =>
                      handleInputChange("ping", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Packet Loss (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.packetLoss}
                    onChange={(e) =>
                      handleInputChange(
                        "packetLoss",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
            </div>

            {/* Performance Metrics Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Average FPS
                  </label>
                  <input
                    type="number"
                    value={formData.fpsAverage}
                    onChange={(e) =>
                      handleInputChange("fpsAverage", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="30"
                    max="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum FPS
                  </label>
                  <input
                    type="number"
                    value={formData.fpsMin}
                    onChange={(e) =>
                      handleInputChange("fpsMin", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum FPS
                  </label>
                  <input
                    type="number"
                    value={formData.fpsMax}
                    onChange={(e) =>
                      handleInputChange("fpsMax", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="30"
                    max="500"
                  />
                </div>
              </div>
            </div>

            {/* Manual Override Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Manual Override (Optional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hardware Tier
                  </label>
                  <select
                    value={formData.tier || ""}
                    onChange={(e) => handleInputChange("tier", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Auto-detect</option>
                    {HARDWARE_TIERS.map((tier) => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier Score (0-100)
                  </label>
                  <input
                    type="number"
                    value={formData.tierScore || ""}
                    onChange={(e) =>
                      handleInputChange("tierScore", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    placeholder="Auto-calculate"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Hardware Profile"}
              </button>

              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={isLoading}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Detecting..." : "Auto-Detect Hardware"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HardwareProfile;
