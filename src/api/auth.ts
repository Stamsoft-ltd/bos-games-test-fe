import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// 1. Register Account
export async function registerAccount(email: string, password: string) {
  const resp = await axios.post(`${API_BASE_URL}/auth/register/account`, {
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
    `${API_BASE_URL}/auth/register/verify-email`,
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
    `${API_BASE_URL}/auth/register/profile`,
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
    `${API_BASE_URL}/auth/register/country`,
    { country },
    { headers: { Authorization: `Bearer ${tempToken}` } }
  );
  // Get access_token from response body (may be refreshed)
  const token = resp.data.access_token;
  return { token };
}

// 5. Login
export async function login(email: string, password: string) {
  const resp = await axios.post(`${API_BASE_URL}/auth/login/email`, {
    email,
    password,
  });
  // Get access_token from response body
  const token = resp.data.access_token;
  return { token };
}

// 6. Get current user
export async function getMe(token: string) {
  const resp = await axios.get(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.data;
}

// 7. Logout
export async function logout(token: string) {
  const resp = await axios.post(
    `${API_BASE_URL}/auth/logout`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return resp.data;
}

// 8. Refresh token
export async function refreshToken(refreshToken: string) {
  const resp = await axios.get(`${API_BASE_URL}/auth/refresh`, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });
  const token = resp.data.access_token;
  return { token };
}

// 9. Steam Login - Desktop
export function steamLogin() {
  // Redirect to Steam OAuth
  window.location.href = `${API_BASE_URL}/auth/login/steam`;
}

// 10. Steam Login - Mobile
export async function steamLoginMobile() {
  const resp = await axios.get(`${API_BASE_URL}/auth/login/steam/mobile`);
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

// 12. Validate access token
export async function validateAccessToken(accessToken: string) {
  try {
    // Try to get user data with the provided token
    const user = await getMe(accessToken);

    // If successful, store the token and user data
    sessionStorage.setItem("token", accessToken);
    sessionStorage.setItem("user", JSON.stringify(user));

    return { user, success: true };
  } catch (error) {
    // Token is invalid
    return { success: false, error };
  }
}
