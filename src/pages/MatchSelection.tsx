import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRecentMatches, MatchListItem } from "../api/match-statistics";

const MatchSelection: React.FC = () => {
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        const recentMatches = await getRecentMatches(token, 50);
        setMatches(recentMatches);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch matches"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ended":
        return "text-green-600 bg-green-100";
      case "live":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreDisplay = (match: MatchListItem) => {
    const { teams, players, gameMode } = match;

    // Check if this is a 1v1 match
    const is1v1Match = !gameMode.requiresTeam || gameMode.playersPerTeam === 1;

    if (is1v1Match && players && players.length >= 2) {
      // For 1v1 matches, use player names
      const player1 = players.find((p) => p.teamNumber === 1);
      const player2 = players.find((p) => p.teamNumber === 2);

      // Backend now provides calculated scores for 1v1 matches
      const team1Score = teams[0]?.score ?? 0;
      const team2Score = teams[1]?.score ?? 0;

      const player1Name = player1?.nickname || "Player 1";
      const player2Name = player2?.nickname || "Player 2";

      return `${player1Name} ${team1Score} - ${team2Score} ${player2Name}`;
    }

    // For team matches, use team names
    if (teams.length === 0) return "N/A";
    if (teams.length === 1) return `${teams[0].name}: ${teams[0].score}`;
    return `${teams[0].name} ${teams[0].score} - ${teams[1].score} ${teams[1].name}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="w-full px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading matches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="w-full px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="mt-2 text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Match Statistics
          </h1>
          <p className="text-gray-600">
            Select a match to view detailed statistics
          </p>
        </div>

        {/* Match List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Matches
            </h2>
          </div>

          {matches.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No matches found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  to={`/match-statistics/${match.id}`}
                  className="block hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                              {match.map}
                            </span>
                          </div>

                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {getScoreDisplay(match)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {match.gameMode.name} •{" "}
                              {formatDate(match.startedAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            match.status
                          )}`}
                        >
                          {match.status}
                        </span>

                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchSelection;
