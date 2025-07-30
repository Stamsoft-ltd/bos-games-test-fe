import axios from "axios";

const API_URL = "http://api.bos-games.stamsoft.com:3000";

// 1. Register Account
export async function registerAccount(email: string, password: string) {
  const resp = await axios.post(`${API_URL}/api/auth/register/account`, {
    email,
    password,
  });
  // Get access_token from response body (backend returns access_token)
  const token = resp.data.access_token;
  return { token };
}

// 2. Verify Email Code
export async function verifyEmail(code: string, tempToken: string) {
  const resp = await axios.post(
    `${API_URL}/api/auth/register/verify-email`,
    { code },
    { headers: { Authorization: `Bearer ${tempToken}` } }
  );
  // Get access_token from response body (may be refreshed)
  const token = resp.data.access_token;
  return { token };
}

// 3. Register Profile
export async function registerProfile(
  nickname: string,
  firstName: string,
  lastName: string,
  tempToken: string
) {
  const resp = await axios.post(
    `${API_URL}/api/auth/register/profile`,
    { nickname, firstName, lastName },
    { headers: { Authorization: `Bearer ${tempToken}` } }
  );
  // Get access_token from response body (may be refreshed)
  const token = resp.data.access_token;
  return { token };
}

// 4. Register Country
export async function registerCountry(country: string, tempToken: string) {
  const resp = await axios.post(
    `${API_URL}/api/auth/register/country`,
    { country },
    { headers: { Authorization: `Bearer ${tempToken}` } }
  );
  // Get access_token from response body (may be refreshed)
  const token = resp.data.access_token;
  return { token };
}

// 5. Login
export async function login(email: string, password: string) {
  const resp = await axios.post(`${API_URL}/api/auth/login/email`, {
    email,
    password,
  });
  // Get access_token from response body
  const token = resp.data.access_token;
  return { token };
}

// 6. Get current user
export async function getMe(token: string) {
  const resp = await axios.get(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}

// 7. Logout
export async function logout(token: string) {
  const resp = await axios.post(
    `${API_URL}/api/auth/logout`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}

// 8. Refresh token
export async function refreshToken(refreshToken: string) {
  const resp = await axios.get(`${API_URL}/api/auth/refresh`, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  const token = resp.data.access_token;
  return { token };
}

// 9. Steam Login - Desktop
export function steamLogin() {
  // Redirect to Steam OAuth
  window.location.href = `${API_URL}/api/auth/login/steam`;
}

// 10. Steam Login - Mobile
export async function steamLoginMobile() {
  const resp = await axios.get(`${API_URL}/api/auth/login/steam/mobile`);
  return resp.data;
}

// 11. Handle social auth callback
export async function handleSocialAuthCallback(
  accessToken: string,
  refreshToken?: string
) {
  // Store tokens
  sessionStorage.setItem("token", accessToken);
  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }

  // Get user data
  const user = await getMe(accessToken);
  sessionStorage.setItem("user", JSON.stringify(user));

  return { user };
}
