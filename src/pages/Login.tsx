import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  login,
  getMe,
  steamLogin,
  steamLoginMobile,
  handleSocialAuthCallback,
  validateAccessToken,
} from "../api/auth";
import { randomEmail } from "../utils/random";
import SteamIcon from "../components/SteamIcon";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password] = useState("Test123!");
  const [accessToken, setAccessToken] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Check if email is passed from registration
  useEffect(() => {
    const emailFromParams = searchParams.get("email");
    if (emailFromParams) {
      setEmail(emailFromParams);
    } else {
      setEmail(randomEmail());
    }

    // Check if we're on mobile
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, [searchParams]);

  // Handle social auth callback
  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      setError("Steam login failed. Please try again.");
      return;
    }

    if (accessToken) {
      handleSocialAuthSuccess(accessToken, refreshToken || undefined);
    }
  }, [searchParams]);

  async function handleSocialAuthSuccess(
    accessToken: string,
    refreshToken?: string
  ) {
    setStatus("Steam login successful! Loading your profile...");
    try {
      const { user } = await handleSocialAuthCallback(
        accessToken,
        refreshToken
      );
      console.log("Steam user", user);

      setStatus("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to complete Steam login"
      );
      setStatus("");
    }
  }

  async function handleLogin() {
    setStatus("Logging in...");
    setError("");
    try {
      const { token } = await login(email, password);

      // Fetch user data using the token
      const user = await getMe(token);
      console.log("user", user);

      // Store token and user info
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      setStatus("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message);
      setStatus("");
    }
  }

  async function handleSteamLogin() {
    setStatus("Redirecting to Steam...");
    setError("");
    try {
      if (isMobile) {
        // For mobile, we'll use the mobile endpoint
        const result = await steamLoginMobile();
        console.log("Steam mobile login result", result);
        // Handle mobile Steam login result
        if (result.access_token) {
          await handleSocialAuthSuccess(
            result.access_token,
            result.refresh_token
          );
        } else {
          setError("Steam mobile login failed");
          setStatus("");
        }
      } else {
        // For desktop, redirect to Steam OAuth
        steamLogin();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Steam login failed");
      setStatus("");
    }
  }

  async function handleAccessTokenLogin() {
    if (!accessToken.trim()) {
      setError("Please enter an access token");
      return;
    }

    setStatus("Validating access token...");
    setError("");

    try {
      const result = await validateAccessToken(accessToken);

      if (result.success) {
        console.log("Access token login successful", result.user);
        setStatus("Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setError(
          "Invalid access token. Please check your token and try again."
        );
        setStatus("");
      }
    } catch (err: any) {
      setError("Failed to validate access token. Please try again.");
      setStatus("");
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-xl font-bold mb-4">Login</h1>

      {/* Access Token Login Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Login with Access Token
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Access Token:
            </label>
            <input
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your access token"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button
            className="w-full bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors duration-200"
            onClick={handleAccessTokenLogin}
          >
            Login with Token
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Use this option if you have an access token from your backend
        </p>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email Login Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
          <span className="text-xs text-gray-500">(Auto-filled for demo)</span>
        </div>
        <button
          className="w-full bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors duration-200"
          onClick={handleLogin}
        >
          Login with Email
        </button>
        {status && <div className="text-blue-600 text-center">{status}</div>}
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div className="text-center">
          <a href="/register" className="underline text-blue-600">
            Don't have an account? Register
          </a>
        </div>
      </div>
    </div>
  );
}
