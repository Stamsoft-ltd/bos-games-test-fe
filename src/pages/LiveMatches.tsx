import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserLiveMatches, LiveMatch } from "../api/live-matches";

const LiveMatches: React.FC = () => {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLiveMatches = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await getUserLiveMatches(token);
        setLiveMatches(response.matches);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load live matches:", error);
        setError("Failed to load live matches");
        setLoading(false);
      }
    };

    loadLiveMatches();
  }, []);

  const handleJoinMatch = (match: LiveMatch) => {
    navigate(`/live-match/${match.matchId}`);
  };

  const handleLaunchGame = (match: LiveMatch) => {
    if (match.serverIp && match.serverPort) {
      // Use steam://connect to try connecting to already running CS2 first
      // If CS2 is not running, it will launch it automatically
      const steamUrl = `steam://rungameid/730//+connect ${match.serverIp}:${match.serverPort}`;
      window.location.href = steamUrl;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Matches</h1>
              <p className="text-gray-600">
                Watch and join active matches in real-time
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                {liveMatches.length} Active
              </div>
            </div>
          </div>
        </div>

        {/* Live Matches Grid */}
        {liveMatches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Live Matches
            </h3>
            <p className="text-gray-500">
              There are currently no active matches. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveMatches.map((match) => (
              <div
                key={match.matchId}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Match Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      Match #{match.matchId.slice(-6)}
                    </h3>
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      LIVE
                    </span>
                  </div>
                  <p className="text-sm opacity-90">
                    {formatTimeAgo(match.startedAt)}
                  </p>
                </div>

                {/* Map Info */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-500">🗺️</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {match.selectedMap?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>👥 {match.players?.length || 0} players</span>
                    <span>•</span>
                    <span>
                      Round {match.currentRound}/{match.totalRounds}
                    </span>
                  </div>
                </div>

                {/* Score Display */}
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-1">
                        {match.team1Name}
                      </h4>
                      <p className="text-2xl font-bold text-red-700">
                        {match.team1Score}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-600 mb-1">
                        {match.team2Name}
                      </h4>
                      <p className="text-2xl font-bold text-blue-700">
                        {match.team2Score}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 border-b border-gray-200">
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          (match.currentRound! / match.totalRounds!) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (match.currentRound! / match.totalRounds!) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => handleJoinMatch(match)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    📊 Watch Match
                  </button>
                  {match.serverIp && match.serverPort && (
                    <button
                      onClick={() => handleLaunchGame(match)}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      🎮 Join Game
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/parties")}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Parties
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveMatches;
