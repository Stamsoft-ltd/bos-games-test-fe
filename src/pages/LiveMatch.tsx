import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLiveMatch, LiveMatch } from "../api/live-matches";

const LiveMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [matchStats, setMatchStats] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setError("No match ID provided");
      setLoading(false);
      return;
    }

    const loadMatchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const matchData = await getLiveMatch(matchId!, token);
        setMatchStats(matchData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load match data:", err);
        setError("Failed to load match data");
        setLoading(false);
      }
    };

    loadMatchData();
  }, [matchId]);

  useEffect(() => {
    // Listen for real-time updates
    const handleRoundEnd = (event: CustomEvent) => {
      const { roundNumber, winner, team1Score, team2Score, duration } =
        event.detail;

      setMatchStats((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          currentRound: roundNumber + 1,
          team1Score,
          team2Score,
          roundHistory: [
            ...(prev.roundHistory || []),
            {
              roundNumber,
              winner,
              team1Score,
              team2Score,
              duration,
            },
          ],
        };
      });
    };

    const handleMatchEnd = (event: CustomEvent) => {
      const { winner, finalTeam1Score, finalTeam2Score } = event.detail;

      setMatchStats((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          status: "ended",
          team1Score: finalTeam1Score,
          team2Score: finalTeam2Score,
        };
      });

      // Redirect to results page after 5 seconds
      setTimeout(() => {
        navigate(`/match-results/${matchId}`);
      }, 5000);
    };

    const handlePlayerUpdate = (event: CustomEvent) => {
      const { steamId, stats } = event.detail;

      setMatchStats((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          players: prev.players?.map((player) =>
            player.steamId === steamId ? { ...player, ...stats } : player
          ),
        };
      });
    };

    // Add event listeners
    window.addEventListener("round-end" as any, handleRoundEnd);
    window.addEventListener("match-end" as any, handleMatchEnd);
    window.addEventListener("player-update" as any, handlePlayerUpdate);

    return () => {
      window.removeEventListener("round-end" as any, handleRoundEnd);
      window.removeEventListener("match-end" as any, handleMatchEnd);
      window.removeEventListener("player-update" as any, handlePlayerUpdate);
    };
  }, [matchId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error || !matchStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">
            {error || "Failed to load match"}
          </p>
          <button
            onClick={() => navigate("/parties")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Parties
          </button>
        </div>
      </div>
    );
  }

  const getTeamPlayers = (teamNumber: number) => {
    return (
      matchStats.players?.filter((player) => player.team === teamNumber) || []
    );
  };

  const getTeamScore = (teamNumber: number) => {
    return teamNumber === 1 ? matchStats.team1Score : matchStats.team2Score;
  };

  const getTeamName = (teamNumber: number) => {
    return teamNumber === 1 ? matchStats.team1Name : matchStats.team2Name;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Match</h1>
              <p className="text-gray-600">Match ID: {matchStats.matchId}</p>
            </div>
            <div className="text-right">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  matchStats.status === "live"
                    ? "bg-green-100 text-green-800"
                    : matchStats.status === "ended"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    matchStats.status === "live" ? "bg-green-400" : "bg-red-400"
                  }`}
                ></div>
                {matchStats.status === "live"
                  ? "LIVE"
                  : matchStats.status === "ended"
                  ? "ENDED"
                  : "LOADING"}
              </div>
            </div>
          </div>

          {/* Map Info */}
          {matchStats.selectedMap && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">
                🗺️ Map
              </h3>
              <p className="text-lg font-bold text-blue-900 capitalize">
                {matchStats.selectedMap.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* Score Display */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                {getTeamName(1)}
              </h3>
              <p className="text-3xl font-bold text-red-900">
                {getTeamScore(1) || 0}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">
                {getTeamName(2)}
              </h3>
              <p className="text-3xl font-bold text-blue-900">
                {getTeamScore(2) || 0}
              </p>
            </div>
          </div>

          {/* Round Info */}
          {matchStats.currentRound && matchStats.totalRounds && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Round Progress
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (matchStats.currentRound / matchStats.totalRounds) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {matchStats.currentRound} / {matchStats.totalRounds}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Team 1 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">
              {getTeamName(1)}
            </h2>
            <div className="space-y-3">
              {getTeamPlayers(1).map((player) => (
                <div
                  key={player.steamId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.connected ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {player.nickname}
                      </p>
                      <p className="text-xs text-gray-500">
                        K/D: {player.kills}/{player.deaths}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {player.kills} kills
                    </p>
                    <p className="text-xs text-gray-500">
                      {player.assists} assists
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">
              {getTeamName(2)}
            </h2>
            <div className="space-y-3">
              {getTeamPlayers(2).map((player) => (
                <div
                  key={player.steamId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        player.connected ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {player.nickname}
                      </p>
                      <p className="text-xs text-gray-500">
                        K/D: {player.kills}/{player.deaths}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {player.kills} kills
                    </p>
                    <p className="text-xs text-gray-500">
                      {player.assists} assists
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Round History */}
        {matchStats.roundHistory && matchStats.roundHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Round History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchStats.roundHistory
                .slice(-6)
                .reverse()
                .map((round) => (
                  <div
                    key={round.roundNumber}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Round {round.roundNumber}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          round.winner === "team1"
                            ? "bg-red-100 text-red-800"
                            : round.winner === "team2"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {round.winner === "team1"
                          ? getTeamName(1)
                          : round.winner === "team2"
                          ? getTeamName(2)
                          : "Draw"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">{round.team1Score}</span>
                      <span className="text-gray-500">-</span>
                      <span className="text-blue-600">{round.team2Score}</span>
                    </div>
                    {round.duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        {round.duration}s
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={() => navigate("/parties")}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Parties
          </button>
          {matchStats.serverIp && matchStats.serverPort && (
            <button
              onClick={() => {
                // Use steam://connect to try connecting to already running CS2 first
                // If CS2 is not running, it will launch it automatically
                const steamUrl = `steam://run/730//+connect ${matchStats.serverIp}:${matchStats.serverPort}`;

                // Try to open in new tab first, fallback to current window
                try {
                  window.open(steamUrl, "_blank");
                } catch (error) {
                  console.log(
                    "Failed to open in new tab, trying current window:",
                    error
                  );
                  window.location.href = steamUrl;
                }
              }}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              🎮 Join Match
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMatchPage;
