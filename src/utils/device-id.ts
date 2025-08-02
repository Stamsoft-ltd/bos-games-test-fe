/**
 * Device ID utility for managing unique device identifiers
 * Generates a device ID if it doesn't exist and stores it in session storage
 */

const DEVICE_ID_KEY = "bos_games_device_id";

export class DeviceIdService {
  private static instance: DeviceIdService;
  private deviceId: string | null = null;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  static getInstance(): DeviceIdService {
    if (!DeviceIdService.instance) {
      DeviceIdService.instance = new DeviceIdService();
    }
    return DeviceIdService.instance;
  }

  /**
   * Get the current device ID or create a new one if it doesn't exist
   */
  getDeviceId(): string {
    if (!this.deviceId) {
      this.deviceId = this.getOrCreateDeviceId();
    }
    return this.deviceId;
  }

  /**
   * Generate a new device ID
   */
  private generateDeviceId(): string {
    // Generate a unique device ID using timestamp and random values
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const userAgent = navigator.userAgent.substring(0, 50); // First 50 chars of user agent
    const hash = this.simpleHash(`${timestamp}-${random}-${userAgent}`);

    return `device_${hash}`;
  }

  /**
   * Simple hash function for generating device ID
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get device ID from session storage or create a new one
   */
  private getOrCreateDeviceId(): string {
    try {
      // Try to get existing device ID from session storage
      const existingDeviceId = sessionStorage.getItem(DEVICE_ID_KEY);

      if (existingDeviceId) {
        console.log("Found existing device ID:", existingDeviceId);
        return existingDeviceId;
      }

      // Generate new device ID
      const newDeviceId = this.generateDeviceId();
      console.log("Generated new device ID:", newDeviceId);

      // Store in session storage
      sessionStorage.setItem(DEVICE_ID_KEY, newDeviceId);

      return newDeviceId;
    } catch (error) {
      console.error("Error accessing session storage:", error);
      // Fallback: generate device ID without storage
      return this.generateDeviceId();
    }
  }

  /**
   * Clear the device ID from session storage
   */
  clearDeviceId(): void {
    try {
      sessionStorage.removeItem(DEVICE_ID_KEY);
      this.deviceId = null;
      console.log("Device ID cleared from session storage");
    } catch (error) {
      console.error("Error clearing device ID:", error);
    }
  }

  /**
   * Check if device ID exists in session storage
   */
  hasDeviceId(): boolean {
    try {
      return sessionStorage.getItem(DEVICE_ID_KEY) !== null;
    } catch (error) {
      console.error("Error checking device ID:", error);
      return false;
    }
  }
}

// Export a convenience function
export const getDeviceId = (): string => {
  return DeviceIdService.getInstance().getDeviceId();
};
