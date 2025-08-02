/**
 * Simple test for device ID functionality
 * This can be run in the browser console to verify device ID generation and storage
 */

import { getDeviceId, DeviceIdService } from "./device-id";

export const testDeviceId = () => {
  console.log("=== Device ID Test ===");

  // Test 1: Get device ID
  const deviceId1 = getDeviceId();
  console.log("Device ID 1:", deviceId1);

  // Test 2: Get device ID again (should be the same)
  const deviceId2 = getDeviceId();
  console.log("Device ID 2:", deviceId2);

  // Test 3: Check if they're the same
  console.log("Device IDs match:", deviceId1 === deviceId2);

  // Test 4: Check session storage
  const storedDeviceId = sessionStorage.getItem("bos_games_device_id");
  console.log("Stored device ID:", storedDeviceId);
  console.log("Stored matches current:", storedDeviceId === deviceId1);

  // Test 5: Test service instance
  const service = DeviceIdService.getInstance();
  const serviceDeviceId = service.getDeviceId();
  console.log("Service device ID:", serviceDeviceId);
  console.log("Service matches getDeviceId:", serviceDeviceId === deviceId1);

  // Test 6: Check if device ID exists
  console.log("Has device ID:", service.hasDeviceId());

  console.log("=== Device ID Test Complete ===");

  return {
    deviceId: deviceId1,
    matches: deviceId1 === deviceId2,
    stored: storedDeviceId === deviceId1,
    hasDeviceId: service.hasDeviceId(),
  };
};

// Export for use in browser console
if (typeof window !== "undefined") {
  (window as any).testDeviceId = testDeviceId;
}
