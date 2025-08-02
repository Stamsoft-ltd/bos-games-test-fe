import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Interface for map banning session
export interface MapBanSession {
  matchId: string;
  gameModeId: string;
  playerIds: string[];
  partyIds: string[];
  leaderIds: string[];
  currentLeaderIndex: number;
  availableMaps: string[];
  bannedMaps: string[];
  selectedMap?: string;
  isComplete: boolean;
}

// Ban a map during the banning phase
export const banMap = async (
  matchId: string,
  leaderId: string,
  mapSlug: string,
  token: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/map-banning/${matchId}/ban`,
    { leaderId, mapSlug },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Get current map banning session status
export const getMapBanSession = async (matchId: string, token: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/map-banning/${matchId}/session`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data as MapBanSession;
};

// Handle ban timeout (auto-ban random map)
export const handleBanTimeout = async (matchId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/map-banning/${matchId}/timeout`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Clean up map banning session
export const cleanupMapBanSession = async (matchId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/map-banning/${matchId}/cleanup`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
