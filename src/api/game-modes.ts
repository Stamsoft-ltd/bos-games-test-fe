import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Get all game modes
export const getAllGameModes = async (token: string) => {
  const response = await axios.get(`${API_BASE_URL}/games/modes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get game modes for a specific game
export const getGameModesByGame = async (gameId: string, token: string) => {
  const response = await axios.get(`${API_BASE_URL}/games/${gameId}/modes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get a specific game mode
export const getGameMode = async (gameModeId: string, token: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/games/modes/${gameModeId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
