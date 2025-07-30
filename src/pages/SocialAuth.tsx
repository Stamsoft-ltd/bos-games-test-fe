import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleSocialAuthCallback } from "../api/auth";

export default function SocialAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      setError("Authentication failed. Please try again.");
      return;
    }

    if (!accessToken) {
      setError("No access token received. Please try logging in again.");
      return;
    }

    handleAuthSuccess(accessToken, refreshToken || undefined);
  }, [searchParams]);

  async function handleAuthSuccess(accessToken: string, refreshToken?: string) {
    try {
      setStatus("Authentication successful! Loading your profile...");

      const { user } = await handleSocialAuthCallback(
        accessToken,
        refreshToken
      );
      console.log("Social auth user", user);

      setStatus("Login successful! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      console.error("Social auth error:", err);
      setError(
        err?.response?.data?.message || "Failed to complete authentication"
      );
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 mt-8">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>

        {error ? (
          <div>
            <h1 className="text-xl font-bold text-red-600 mb-4">
              Authentication Error
            </h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">
              Processing Login
            </h1>
            <p className="text-gray-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
