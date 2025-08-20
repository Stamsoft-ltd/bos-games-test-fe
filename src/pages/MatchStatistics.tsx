import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getMatchStatistics,
  getMatchRounds,
  MatchStatistics as MatchStatisticsType,
} from "../api/match-statistics";

const MatchStatistics: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [matchData, setMatchData] = useState<MatchStatisticsType | null>(null);
  const [roundsData, setRoundsData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "scoreboard" | "rounds" | "weapons" | "duels" | "heatmaps"
  >("scoreboard");

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) return;

      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        // Fetch all data in parallel
        const [matchData, roundsData] = await Promise.all([
          getMatchStatistics(matchId, token),
          getMatchRounds(matchId, token),
        ]);

        setMatchData(matchData);
        setRoundsData(roundsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch match data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [matchId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 100 / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const calculateKDRatio = (kills: number, deaths: number) => {
    if (deaths === 0) return kills > 0 ? kills.toFixed(2) : "0.00";
    return (kills / deaths).toFixed(2);
  };

  const calculateHeadshotPercentage = (headshots: number, kills: number) => {
    if (kills === 0) return "0%";
    return `${Math.round((headshots / kills) * 100)}%`;
  };

  const calculateADR = (damage: number, rounds: number) => {
    if (rounds === 0) return "0";
    return Math.round(damage / rounds).toString();
  };

  const getTeamScore = (teamNumber: number) => {
    const team = matchData?.teams.find((t) => t.teamNumber === teamNumber);
    return team?.score || 0;
  };

  const getTeamName = (teamNumber: number) => {
    // Check if this is a 1v1 match (no teams or single player per team)
    const is1v1Match =
      !matchData?.gameMode.requiresTeam ||
      matchData?.gameMode.playersPerTeam === 1;

    if (is1v1Match) {
      // For 1v1 matches, use player names as team names
      const player = matchData?.players.find(
        (p) => p.teamNumber === teamNumber
      );
      return player?.nickname || `Player ${teamNumber}`;
    } else {
      // For team matches, use team names
      const team = matchData?.teams.find((t) => t.teamNumber === teamNumber);
      return team?.name || `Team ${teamNumber}`;
    }
  };

  const getTeamPlayers = (teamNumber: number) => {
    return matchData?.players.filter((p) => p.teamNumber === teamNumber) || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="w-full px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading match statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="w-full px-4 py-8">
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-400">Error</h3>
            <p className="mt-2 text-red-300">
              {error || "Failed to load match data"}
            </p>
            <Link
              to="/match-selection"
              className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Back to Match Selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="w-full py-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/match-selection"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{matchData.map}</h1>
                <p className="text-gray-400">
                  Played: {formatDate(matchData.startedAt)}
                </p>
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-sm text-gray-400">{getTeamName(1)}</div>
                <div className="text-4xl font-bold text-blue-400">
                  {getTeamScore(1)}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-400">-</div>
              <div className="text-center">
                <div className="text-sm text-gray-400">{getTeamName(2)}</div>
                <div className="text-4xl font-bold text-red-400">
                  {getTeamScore(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="w-full px-6">
          <nav className="flex space-x-8">
            {[
              { id: "scoreboard", label: "Scoreboard", icon: "📊" },
              { id: "rounds", label: "Rounds", icon: "⏰" },
              { id: "weapons", label: "Weapons", icon: "🔫" },
              { id: "duels", label: "Duels", icon: "💎" },
              { id: "heatmaps", label: "Heatmaps", icon: "🗺️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-8">
        {activeTab === "scoreboard" && (
          <div className="space-y-6 px-6">
            {/* Team 1 Players */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-blue-900/20 border-b border-blue-500/20">
                <h2 className="text-lg font-semibold text-blue-400">
                  {getTeamName(1)}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        K
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        D
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        A
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        +/-
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        K/D
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        ADR
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        HS%
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Plants
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Defuses
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {getTeamPlayers(1).map((player) => (
                      <tr key={player.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                              {player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <span className="ml-3 text-sm font-medium">
                              {player.nickname}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.kills}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.deaths}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.assists}
                        </td>
                        <td
                          className={`px-4 py-3 text-center text-sm font-medium ${
                            player.kills - player.deaths > 0
                              ? "text-green-400"
                              : player.kills - player.deaths < 0
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        >
                          {player.kills - player.deaths > 0 ? "+" : ""}
                          {player.kills - player.deaths}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {calculateKDRatio(player.kills, player.deaths)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {calculateADR(
                            player.damage,
                            matchData.totalRounds || 1
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {calculateHeadshotPercentage(
                            player.headshotKills,
                            player.kills
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.plants || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.defuses || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.kills > player.deaths
                                ? "bg-green-900/20 text-green-400"
                                : "bg-red-900/20 text-red-400"
                            }`}
                          >
                            {calculateKDRatio(player.kills, player.deaths)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team 2 Players */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-red-900/20 border-b border-red-500/20">
                <h2 className="text-lg font-semibold text-red-400">
                  {getTeamName(2)}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        K
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        D
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        A
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        +/-
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        K/D
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        ADR
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        HS%
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Plants
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Defuses
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {getTeamPlayers(2).map((player) => (
                      <tr key={player.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                              {player.nickname.charAt(0).toUpperCase()}
                            </div>
                            <span className="ml-3 text-sm font-medium">
                              {player.nickname}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.kills}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.deaths}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.assists}
                        </td>
                        <td
                          className={`px-4 py-3 text-center text-sm font-medium ${
                            player.kills - player.deaths > 0
                              ? "text-green-400"
                              : player.kills - player.deaths < 0
                              ? "text-red-400"
                              : "text-gray-400"
                          }`}
                        >
                          {player.kills - player.deaths > 0 ? "+" : ""}
                          {player.kills - player.deaths}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {calculateKDRatio(player.kills, player.deaths)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {calculateADR(
                            player.damage,
                            matchData.totalRounds || 1
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {calculateHeadshotPercentage(
                            player.headshotKills,
                            player.kills
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.plants || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.defuses || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.kills > player.deaths
                                ? "bg-green-900/20 text-green-400"
                                : "bg-red-900/20 text-red-400"
                            }`}
                          >
                            {calculateKDRatio(player.kills, player.deaths)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Match Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Match Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white font-medium">
                    {formatDuration(matchData.duration)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Rounds</p>
                  <p className="text-white font-medium">
                    {matchData.totalRounds || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Game Mode</p>
                  <p className="text-white font-medium">
                    {matchData.gameMode.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-white font-medium capitalize">
                    {matchData.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "rounds" && (
          <div className="px-6">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Round History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Round
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Winner
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Bomb Planted
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Bomb Defused
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Deaths
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {roundsData.map((round) => (
                      <tr
                        key={round.roundNumber}
                        className="hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {round.roundNumber}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              round.winner === "CT"
                                ? "bg-blue-900/20 text-blue-400"
                                : round.winner === "T"
                                ? "bg-red-900/20 text-red-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {round.winner || "N/A"}
                          </span>
                          {round.winningTeam && (
                            <div className="text-xs text-gray-400 mt-1">
                              {getTeamName(round.winningTeam)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-300">
                          {round.endReason || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-300">
                          {round.duration
                            ? formatDuration(round.duration)
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              round.bombPlanted
                                ? "bg-green-900/20 text-green-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {round.bombPlanted ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              round.bombDefused
                                ? "bg-green-900/20 text-green-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {round.bombDefused ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-300">
                          {round.totalDeaths}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "weapons" && (
          <div className="space-y-6 px-6">
            {!matchData?.players || matchData.players.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Weapon Statistics
                </h3>
                <p className="text-gray-400">
                  No weapon data available for this match.
                </p>
              </div>
            ) : (
              matchData.players
                ?.filter((player) => {
                  return player.weaponStats && player.weaponStats.length > 0;
                })
                .map((player) => {
                  const playerWeapons = player.weaponStats || [];

                  return (
                    <div
                      key={player.id}
                      className="bg-gray-800 rounded-lg overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-gray-700">
                        <h3 className="text-lg font-semibold">
                          {player.nickname ||
                            player.steamId ||
                            "Unknown Player"}
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Weapon
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Headshots
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Shots Fired
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Shots Hit
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Accuracy
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {playerWeapons.length > 0 ? (
                              playerWeapons.map((weapon) => (
                                <tr
                                  key={weapon.weapon}
                                  className="hover:bg-gray-700/50"
                                >
                                  <td className="px-4 py-3 text-sm font-medium">
                                    {weapon.weapon}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm">
                                    {weapon.headshots}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm">
                                    {weapon.shots}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm">
                                    {weapon.hits}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        weapon.accuracy >= 50
                                          ? "bg-green-900/20 text-green-400"
                                          : weapon.accuracy >= 25
                                          ? "bg-yellow-900/20 text-yellow-400"
                                          : "bg-red-900/20 text-red-400"
                                      }`}
                                    >
                                      {weapon.accuracy.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-3 text-center text-sm text-gray-400"
                                >
                                  No weapon data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {activeTab === "duels" && (
          <div className="px-6 space-y-6">
            {/* 1vX Duels Section */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">1vX Duels</h3>
                <p className="text-sm text-gray-400 mt-1">
                  1vX attempts and success rates for each player
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        1vX Attempts
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        1vX Wins
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Win Rate
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {matchData.players?.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {player.nickname}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.teamNumber === 1
                                ? "bg-red-900/20 text-red-400"
                                : "bg-blue-900/20 text-blue-400"
                            }`}
                          >
                            {getTeamName(player.teamNumber)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          {player.oneVsXAttempts}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          {player.oneVsXWins}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.oneVsXAttempts > 0
                                ? player.oneVsXWins / player.oneVsXAttempts >=
                                  0.6
                                  ? "bg-green-900/20 text-green-400"
                                  : player.oneVsXWins / player.oneVsXAttempts >=
                                    0.4
                                  ? "bg-yellow-900/20 text-yellow-400"
                                  : "bg-red-900/20 text-red-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.oneVsXAttempts > 0
                              ? `${Math.round(
                                  (player.oneVsXWins / player.oneVsXAttempts) *
                                    100
                                )}%`
                              : "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.score > 0
                                ? "bg-green-900/20 text-green-400"
                                : player.score < 0
                                ? "bg-red-900/20 text-red-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.score > 0 ? "+" : ""}
                            {player.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Multi-Kill Statistics Section */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Multi-Kill Statistics</h3>
                <p className="text-sm text-gray-400 mt-1">
                  2ks, 3ks, 4ks, 5ks achievements for each player
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        2ks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        3ks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        4ks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        5ks
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Total Multi-Kills
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {matchData.players?.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {player.nickname}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.teamNumber === 1
                                ? "bg-red-900/20 text-red-400"
                                : "bg-blue-900/20 text-blue-400"
                            }`}
                          >
                            {getTeamName(player.teamNumber)}
                          </span>
                        </td>
                        {/* 2ks - Double Kills */}
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.doubleKills > 0
                                ? "bg-green-900/20 text-green-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.doubleKills}
                          </span>
                        </td>
                        {/* 3ks - Triple Kills */}
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.tripleKills > 0
                                ? "bg-green-900/20 text-green-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.tripleKills}
                          </span>
                        </td>
                        {/* 4ks - Quadra Kills */}
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.quadraKills > 0
                                ? "bg-green-900/20 text-green-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.quadraKills}
                          </span>
                        </td>
                        {/* 5ks - Penta Kills */}
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.pentaKills > 0
                                ? "bg-green-900/20 text-green-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.pentaKills}
                          </span>
                        </td>
                        {/* Total Multi-Kills */}
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.doubleKills +
                                player.tripleKills +
                                player.quadraKills +
                                player.pentaKills >
                              0
                                ? "bg-blue-900/20 text-blue-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.doubleKills +
                              player.tripleKills +
                              player.quadraKills +
                              player.pentaKills}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Entry Duels Section */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Entry Duels</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Entry attempts and success rates for each player
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Entry Attempts
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Entry Successes
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Success Rate
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        K/D Ratio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {matchData.players?.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {player.nickname}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.teamNumber === 1
                                ? "bg-red-900/20 text-red-400"
                                : "bg-blue-900/20 text-blue-400"
                            }`}
                          >
                            {getTeamName(player.teamNumber)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          {player.entryAttempts}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          {player.entrySuccesses}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.entryAttempts > 0
                                ? player.entrySuccesses /
                                    player.entryAttempts >=
                                  0.6
                                  ? "bg-green-900/20 text-green-400"
                                  : player.entrySuccesses /
                                      player.entryAttempts >=
                                    0.4
                                  ? "bg-yellow-900/20 text-yellow-400"
                                  : "bg-red-900/20 text-red-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.entryAttempts > 0
                              ? `${Math.round(
                                  (player.entrySuccesses /
                                    player.entryAttempts) *
                                    100
                                )}%`
                              : "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.kills > player.deaths
                                ? "bg-green-900/20 text-green-400"
                                : player.kills < player.deaths
                                ? "bg-red-900/20 text-red-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {calculateKDRatio(player.kills, player.deaths)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Duels Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Duels Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Total 1vX Attempts</p>
                  <p className="text-white font-medium">
                    {matchData.players?.reduce(
                      (sum, player) => sum + player.oneVsXAttempts,
                      0
                    ) || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total 1vX Wins</p>
                  <p className="text-white font-medium">
                    {matchData.players?.reduce(
                      (sum, player) => sum + player.oneVsXWins,
                      0
                    ) || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Entry Attempts</p>
                  <p className="text-white font-medium">
                    {matchData.players?.reduce(
                      (sum, player) => sum + player.entryAttempts,
                      0
                    ) || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Entry Successes</p>
                  <p className="text-white font-medium">
                    {matchData.players?.reduce(
                      (sum, player) => sum + player.entrySuccesses,
                      0
                    ) || 0}
                  </p>
                </div>
              </div>

              {/* Multi-Kill Breakdown */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-md font-semibold mb-3">
                  Multi-Kill Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">2ks</p>
                    <p className="text-white font-medium">
                      {matchData.players?.reduce(
                        (sum, player) => sum + player.doubleKills,
                        0
                      ) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">3ks</p>
                    <p className="text-white font-medium">
                      {matchData.players?.reduce(
                        (sum, player) => sum + player.tripleKills,
                        0
                      ) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">4ks</p>
                    <p className="text-white font-medium">
                      {matchData.players?.reduce(
                        (sum, player) => sum + player.quadraKills,
                        0
                      ) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">5ks</p>
                    <p className="text-white font-medium">
                      {matchData.players?.reduce(
                        (sum, player) => sum + player.pentaKills,
                        0
                      ) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Multi-Kills</p>
                    <p className="text-white font-medium">
                      {matchData.players?.reduce(
                        (sum, player) =>
                          sum +
                          player.doubleKills +
                          player.tripleKills +
                          player.quadraKills +
                          player.pentaKills,
                        0
                      ) || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "heatmaps" && (
          <div className="space-y-6 px-6">
            {matchData.players?.map((player) => (
              <div
                key={player.id}
                className="bg-gray-800 rounded-lg overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold">{player.nickname}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Utility Type
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Thrown
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Successful
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Success Rate
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Damage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      <tr className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          Flashbangs
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.flashesThrown}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.flashesSuccessful}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              player.flashesThrown > 0
                                ? player.flashesSuccessful /
                                    player.flashesThrown >=
                                  0.6
                                  ? "bg-green-900/20 text-green-400"
                                  : player.flashesSuccessful /
                                      player.flashesThrown >=
                                    0.4
                                  ? "bg-yellow-900/20 text-yellow-400"
                                  : "bg-red-900/20 text-red-400"
                                : "bg-gray-900/20 text-gray-400"
                            }`}
                          >
                            {player.flashesThrown > 0
                              ? `${Math.round(
                                  (player.flashesSuccessful /
                                    player.flashesThrown) *
                                    100
                                )}%`
                              : "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">-</td>
                      </tr>
                      <tr className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          Other Utility
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.utilityThrown}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">-</td>
                        <td className="px-4 py-3 text-center text-sm">-</td>
                        <td className="px-4 py-3 text-center text-sm">
                          {player.utilityDamage}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchStatistics;
