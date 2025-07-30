import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  registerAccount,
  verifyEmail,
  registerProfile,
  registerCountry,
} from "../api/auth";
import {
  randomEmail,
  randomNickname,
  randomName,
  randomCountry,
} from "../utils/random";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(randomEmail());
  const [password] = useState("Test123!");
  const [nickname] = useState(randomNickname());
  const [firstName] = useState(randomName());
  const [lastName] = useState(randomName());
  const [country] = useState(randomCountry());
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [tempToken, setTempToken] = useState("");
  const [isStarted, setIsStarted] = useState(false);

  // Demo: Simulate code (in real backend, fetch code from email, or expose for test/dev)
  const devCode = "111111";

  // Automatic registration process
  useEffect(() => {
    if (!isStarted) return;

    const runAutomaticRegistration = async () => {
      try {
        // Step 1: Register Account
        setCurrentStep(1);
        setStatus("Step 1/4: Creating account...");
        const { token: accountToken } = await registerAccount(email, password);
        setTempToken(accountToken);

        // Step 2: Verify Email
        setCurrentStep(2);
        setStatus("Step 2/4: Verifying email...");
        const { token: verifyToken } = await verifyEmail(devCode, accountToken);
        setTempToken(verifyToken);

        // Step 3: Register Profile
        setCurrentStep(3);
        setStatus("Step 3/4: Setting up profile...");
        const { token: profileToken } = await registerProfile(
          nickname,
          firstName,
          lastName,
          verifyToken
        );
        setTempToken(profileToken);

        // Step 4: Register Country
        setCurrentStep(4);
        setStatus("Step 4/4: Setting country...");
        const { token: finalToken } = await registerCountry(
          country,
          profileToken
        );
        setTempToken(finalToken);

        // Complete!
        setCurrentStep(5);
        setStatus("🎉 Registration Complete! Redirecting to login...");

        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          navigate(`/login?email=${encodeURIComponent(email)}`);
        }, 2000);
      } catch (err: any) {
        console.error("Registration error:", err);
        setError(
          err?.response?.data?.message || err.message || "Registration failed"
        );
      }
    };

    // Start the automatic process
    runAutomaticRegistration();
  }, [
    isStarted,
    email,
    password,
    nickname,
    firstName,
    lastName,
    country,
    navigate,
  ]);

  const handleStartRegistration = () => {
    setIsStarted(true);
    setError("");
  };

  const steps = [
    "Starting...",
    "Creating account",
    "Verifying email",
    "Setting up profile",
    "Setting country",
    "Complete!",
  ];

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-xl font-bold mb-4">Automatic User Registration</h1>

      {/* Start Button */}
      {!isStarted && (
        <div className="mb-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Generated User Data:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Email:</span> {email}
              </div>
              <div>
                <span className="font-medium">Password:</span> {password}
              </div>
              <div>
                <span className="font-medium">Nickname:</span> {nickname}
              </div>
              <div>
                <span className="font-medium">Name:</span> {firstName}{" "}
                {lastName}
              </div>
              <div>
                <span className="font-medium">Country:</span> {country}
              </div>
            </div>
          </div>
          <button
            onClick={handleStartRegistration}
            className="w-full bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 font-semibold"
          >
            🚀 Start Automatic Registration
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {isStarted && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {currentStep}/5</span>
            <span>{Math.round((currentStep / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Current Step Display */}
      {isStarted && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-semibold text-blue-800 mb-2">
            {steps[currentStep]}
          </div>
          <div className="text-sm text-blue-600">{status}</div>
        </div>
      )}

      {/* Token Display (for debugging) */}
      {tempToken && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold mb-2 text-yellow-800">Current Token:</h3>
          <div className="text-xs text-yellow-700 break-all">
            {tempToken.substring(0, 50)}...
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-semibold mb-2">
            Registration Error:
          </div>
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Animation */}
      {isStarted && currentStep < 5 && !error && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <div className="mt-2 text-sm text-gray-600">Please wait...</div>
        </div>
      )}

      {/* Success Message */}
      {currentStep === 5 && (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 font-semibold mb-2">
            ✅ Registration Successful!
          </div>
          <div className="text-green-600 text-sm">
            You can now login with the generated credentials above.
          </div>
        </div>
      )}
    </div>
  );
}
