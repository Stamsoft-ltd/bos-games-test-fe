import axios from "axios";

// Debug log for easier debugging
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Get auth token for API calls
const getAuthToken = () => {
  return sessionStorage.getItem("token");
};

// Hardware profile interface
export interface HardwareProfileData {
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

/**
 * Submit hardware specifications to create/update user's hardware profile
 * @param hardwareData - The hardware specifications to submit
 * @returns Promise with the created/updated hardware profile
 */
export const submitHardwareSpecs = async (
  hardwareData: HardwareProfileData
) => {
  console.log("Submitting hardware specs:", hardwareData);

  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/hardware/specs`,
      hardwareData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Hardware specs submitted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error submitting hardware specs:", error);
    throw error;
  }
};

/**
 * Auto-detect hardware specifications
 * @returns Promise with the auto-detected hardware profile
 */
export const autoDetectHardware = async () => {
  console.log("Attempting hardware auto-detection...");

  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/hardware/auto-detect`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Hardware auto-detection successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error during hardware auto-detection:", error);
    throw error;
  }
};

/**
 * Get user's current hardware profile
 * @returns Promise with the user's hardware profile
 */
export const getHardwareProfile = async () => {
  console.log("Fetching hardware profile...");

  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/hardware/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Hardware profile fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching hardware profile:", error);
    throw error;
  }
};

/**
 * Get user's hardware tier
 * @returns Promise with the user's hardware tier
 */
export const getHardwareTier = async () => {
  console.log("Fetching hardware tier...");

  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/hardware/tier`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Hardware tier fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching hardware tier:", error);
    throw error;
  }
};

/**
 * Get user's hardware tier score
 * @returns Promise with the user's hardware tier score
 */
export const getHardwareTierScore = async () => {
  console.log("Fetching hardware tier score...");

  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/hardware/tier-score`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Hardware tier score fetched successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching hardware tier score:", error);
    throw error;
  }
};
