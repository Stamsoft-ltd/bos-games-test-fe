import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../api/auth";
import { getMe } from "../api/user";

export default function Dashboard() {
  const user = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("token", token);
    if (token) {
      getMe(token)
        .then(setUserProfile)
        .catch(() => {
          // Token might be invalid, redirect to login
          sessionStorage.clear();
          navigate("/login");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, navigate]);

  async function handleLogout() {
    if (token) {
      try {
        await logout(token);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    sessionStorage.clear();
    navigate("/login");
  }

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!token) {
    return (
      <div>
        <p className="text-red-600">Not logged in.</p>
        <Link to="/login" className="underline text-blue-600">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      {userProfile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">
            Welcome, {userProfile.nickname || userProfile.email}!
          </h2>
          <div className="text-sm text-gray-600">
            <p>Email: {userProfile.email}</p>
            {userProfile.firstName && (
              <p>
                Name: {userProfile.firstName} {userProfile.lastName}
              </p>
            )}
            {userProfile.country && <p>Country: {userProfile.country}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link
          to="/friends"
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <h3 className="font-semibold text-blue-800">👥 Friends</h3>
          <p className="text-sm text-blue-600">
            Manage friends and friend requests
          </p>
        </Link>

        <Link
          to="/teams"
          className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <h3 className="font-semibold text-green-800">🏆 Teams</h3>
          <p className="text-sm text-green-600">
            Create teams and manage team invites
          </p>
        </Link>

        <Link
          to="/parties"
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <h3 className="font-semibold text-purple-800">🎮 Parties</h3>
          <p className="text-sm text-purple-600">
            Create parties and manage party invites
          </p>
        </Link>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800">🔧 Quick Actions</h3>
          <div className="mt-2 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>
          <strong>JWT Token:</strong> {token.substring(0, 20)}...
        </p>
      </div>
    </div>
  );
}
