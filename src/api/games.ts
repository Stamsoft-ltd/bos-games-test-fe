import axios from "axios";
const API_URL = "http://api.bos-games.stamsoft.com:3000";

// Get all games
export async function getAllGames(token: string) {
  const resp = await axios.get(`${API_URL}/api/games`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}
