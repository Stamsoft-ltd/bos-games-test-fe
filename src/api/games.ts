import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Get all games
export async function getAllGames(token: string) {
  const resp = await axios.get(`${API_BASE_URL}/api/games`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}
