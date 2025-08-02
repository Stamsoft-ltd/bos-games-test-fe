import React, { useState, useEffect } from "react";
import { getDeviceId } from "../utils/device-id";

interface DeviceIdDisplayProps {
  showDetails?: boolean;
}

export const DeviceIdDisplay: React.FC<DeviceIdDisplayProps> = ({
  showDetails = false,
}) => {
  const [deviceId, setDeviceId] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  if (!showDetails && !isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-1 rounded text-xs opacity-50 hover:opacity-100"
        >
          Device ID
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-4 rounded shadow-lg max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Device Information</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-gray-400">Device ID:</span>
          <div className="break-all font-mono bg-gray-700 p-1 rounded mt-1">
            {deviceId}
          </div>
        </div>

        <div>
          <span className="text-gray-400">Platform:</span>
          <div className="mt-1">
            {navigator.userAgent.includes("iPhone") ||
            navigator.userAgent.includes("iPad")
              ? "iOS"
              : navigator.userAgent.includes("Android")
              ? "Android"
              : navigator.userAgent.includes("Windows")
              ? "Windows"
              : "Web"}
          </div>
        </div>

        <div>
          <span className="text-gray-400">User Agent:</span>
          <div className="break-all text-xs mt-1 opacity-75">
            {navigator.userAgent.substring(0, 100)}...
          </div>
        </div>
      </div>
    </div>
  );
};
