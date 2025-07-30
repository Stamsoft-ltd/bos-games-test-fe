import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function sendFriendRequest(userId: string, token: string) {
  const resp = await axios.post(
    `${API_BASE_URL}/friend-requests/${userId}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}
export async function getReceivedFriendRequests(token: string) {
  const resp = await axios.get(`${API_BASE_URL}/friend-requests/received`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}
export async function getSentFriendRequests(token: string) {
  const resp = await axios.get(`${API_BASE_URL}/friend-requests/sent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}
export async function acceptFriendRequest(requestId: string, token: string) {
  const resp = await axios.post(
    `${API_BASE_URL}/friend-requests/${requestId}/accept`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}
export async function declineFriendRequest(requestId: string, token: string) {
  const resp = await axios.post(
    `${API_BASE_URL}/friend-requests/${requestId}/decline`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}
