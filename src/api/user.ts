import axios from "axios";
const API_URL = "http://api.bos-games.stamsoft.com:3000";

// Get all users (for finding friends)
export async function getAllUsers(token: string) {
  const resp = await axios.get(`${API_URL}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data.data;
}

// Get current user profile
export async function getMe(token: string) {
  const resp = await axios.get(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}

// Get user by ID
export async function getUserById(userId: string) {
  const resp = await axios.get(`${API_URL}/api/users/${userId}`);
  return resp.data;
}

// Get friends list
export async function getFriends(token: string) {
  const resp = await axios.get(`${API_URL}/api/friends`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}

export async function searchUsers(
  token: string,
  searchQuery?: string,
  limit?: number
) {
  const params = new URLSearchParams();
  if (searchQuery) params.append("search", searchQuery);
  if (limit) params.append("limit", limit.toString());

  const resp = await axios.get(`${API_URL}/api/users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data.data; // Return the data array from paginated response
}

export async function acceptMatchFromNotification(
  token: string,
  matchId: string
) {
  const resp = await axios.post(
    `${API_URL}/api/match-acceptance/${matchId}/accept`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}

export async function declineMatchFromNotification(
  token: string,
  matchId: string
) {
  const resp = await axios.post(
    `${API_URL}/api/match-acceptance/${matchId}/decline`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}
