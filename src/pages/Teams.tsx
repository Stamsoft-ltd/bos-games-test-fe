import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createTeam,
  getAllTeams,
  inviteToTeam,
  getReceivedTeamInvites,
  acceptTeamInvite,
  declineTeamInvite,
  inviteFriendToTeam,
} from "../api/team";
import { getAllUsers, getFriends } from "../api/user";
import { getAllGames } from "../api/games";
import { getAllGameModes, getGameModesByGame } from "../api/game-modes";

export default function TeamsPage() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token") || "";
  const [teamName, setTeamName] = useState("");
  const [selectedGameId, setSelectedGameId] = useState("");
  const [gameModeId, setGameModeId] = useState("");
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [gameModes, setGameModes] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState("");
  const [selectedFriendForInvite, setSelectedFriendForInvite] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
  }, [token, navigate]);

  useEffect(() => {
    if (token) {
      Promise.all([
        getAllUsers(token),
        getAllGames(token),
        getAllTeams(token),
        getReceivedTeamInvites(token),
        getFriends(token),
        getAllGameModes(token),
      ])
        .then(
          ([
            usersData,
            gamesData,
            teamsData,
            invitesData,
            friendsData,
            gameModesData,
          ]) => {
            setUsers(usersData.data || usersData); // Handle both paginated and non-paginated responses
            setGames(gamesData);
            setMyTeams(teamsData);
            setInvites(invitesData);
            setFriends(friendsData);
            setGameModes(gameModesData);
          }
        )
        .catch((error) => {
          console.error("Error loading data:", error);
          setStatus("Error loading data");
          // If token is invalid, redirect to login
          if (error?.response?.status === 401) {
            sessionStorage.removeItem("token");
            navigate("/login");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token, navigate]);

  // Load game modes when a game is selected
  useEffect(() => {
    if (selectedGameId && token) {
      getGameModesByGame(selectedGameId, token)
        .then((modes) => {
          setGameModes(modes);
          setGameModeId(""); // Reset game mode selection
        })
        .catch((error) => {
          console.error("Error loading game modes:", error);
          setGameModes([]);
        });
    } else {
      setGameModes([]);
      setGameModeId("");
    }
  }, [selectedGameId, token]);

  async function handleCreateTeam() {
    if (!teamName.trim() || !gameModeId) {
      setStatus("Please enter team name and select a game mode");
      return;
    }

    setStatus("Creating team...");
    try {
      const team = await createTeam(teamName, gameModeId, inviteeIds, token);
      setStatus("Team created successfully!");
      setMyTeams((prev) => [...prev, team]);
      setTeamName("");
      setSelectedGameId("");
      setGameModeId("");
      setInviteeIds([]);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleInvite(teamId: string, userId: string) {
    try {
      await inviteToTeam(teamId, userId, token);
      setStatus("Team invite sent!");
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleInviteFriendToTeam() {
    if (!selectedTeamForInvite || !selectedFriendForInvite) {
      setStatus("Please select both a team and a friend");
      return;
    }

    setStatus("Inviting friend to team...");
    try {
      await inviteFriendToTeam(
        selectedTeamForInvite,
        selectedFriendForInvite,
        token
      );
      setStatus("Friend invited to team successfully!");
      setSelectedTeamForInvite("");
      setSelectedFriendForInvite("");
      // Refresh teams to show updated member count
      const teamsData = await getAllTeams(token);
      setMyTeams(teamsData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleAcceptInvite(inviteId: string) {
    try {
      await acceptTeamInvite(inviteId, token);
      setStatus("Team invite accepted!");
      // Refresh invites and teams
      const [invitesData, teamsData] = await Promise.all([
        getReceivedTeamInvites(token),
        getAllTeams(token),
      ]);
      setInvites(invitesData);
      setMyTeams(teamsData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleDeclineInvite(inviteId: string) {
    try {
      await declineTeamInvite(inviteId, token);
      setStatus("Team invite declined");
      // Refresh invites
      const invitesData = await getReceivedTeamInvites(token);
      setInvites(invitesData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  if (!token) {
    return <div className="text-center">Redirecting to login...</div>;
  }

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Link to="/dashboard" className="text-indigo-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {status && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          {status}
        </div>
      )}

      {/* Create Team */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">🏆 Create New Team</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name:</label>
            <input
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Game:</label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a game</option>
              {games.map((game) => (
                <option value={game.id} key={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Game Mode:</label>
            <select
              value={gameModeId}
              onChange={(e) => setGameModeId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={!selectedGameId}
            >
              <option value="">
                {selectedGameId ? "Select a game mode" : "First select a game"}
              </option>
              {gameModes.map((mode) => (
                <option value={mode.id} key={mode.id}>
                  {mode.name} ({mode.playersPerTeam}v{mode.playersPerTeam}) -{" "}
                  {mode.totalPlayers} players total
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Invite Friends:
            </label>
            <div className="border rounded px-3 py-2 max-h-40 overflow-y-auto">
              {friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <label
                      key={friend.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={inviteeIds.includes(friend.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInviteeIds([...inviteeIds, friend.id]);
                          } else {
                            setInviteeIds(
                              inviteeIds.filter((id) => id !== friend.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">
                        {friend.nickname || friend.email}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No friends to invite</p>
              )}
            </div>
            {inviteeIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {inviteeIds.length} friend
                {inviteeIds.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={handleCreateTeam}
            className="bg-indigo-500 text-white rounded px-4 py-2 hover:bg-indigo-600"
            disabled={!teamName.trim() || !gameModeId}
          >
            Create Team
          </button>
        </div>
      </div>

      {/* Invite Friends to Existing Teams */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          👥 Invite Friends to Existing Teams
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Team:
            </label>
            <select
              value={selectedTeamForInvite}
              onChange={(e) => setSelectedTeamForInvite(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a team</option>
              {myTeams.map((team) => (
                <option value={team.id} key={team.id}>
                  {team.name} ({team.gameMode?.name || "Unknown Mode"}) -{" "}
                  {team.players?.length || 0}/
                  {team.gameMode?.playersPerTeam || 5} members
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Friend:
            </label>
            <select
              value={selectedFriendForInvite}
              onChange={(e) => setSelectedFriendForInvite(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a friend</option>
              {friends.map((friend) => (
                <option value={friend.id} key={friend.id}>
                  {friend.nickname || friend.email}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleInviteFriendToTeam}
            className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600"
            disabled={!selectedTeamForInvite || !selectedFriendForInvite}
          >
            Invite Friend to Team
          </button>
        </div>
      </div>

      {/* My Teams */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          My Teams ({myTeams.length})
        </h2>
        {myTeams.length > 0 ? (
          <div className="space-y-2">
            {myTeams.map((team) => (
              <div key={team.id} className="p-3 bg-gray-50 rounded">
                <div className="font-medium">{team.name}</div>
                <div className="text-sm text-gray-600">
                  Game Mode: {team.gameMode?.name || "Unknown Mode"}
                </div>
                <div className="text-sm text-gray-600">
                  Game: {team.gameMode?.game?.name || "Unknown Game"}
                </div>
                <div className="text-sm text-gray-600">
                  Owner: {team.owner?.nickname || team.owner?.email}
                </div>
                <div className="text-sm text-gray-600">
                  Members: {team.players?.length || 0}/
                  {team.gameMode?.playersPerTeam || 5}
                </div>
                <div className="text-sm text-gray-600">
                  Players:{" "}
                  {team.players?.map((p) => p.nickname || p.email).join(", ") ||
                    "None"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No teams created yet. Create your first team above!
          </p>
        )}
      </div>

      {/* Received Team Invites */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          📥 Received Team Invites ({invites.length})
        </h2>
        {invites.length > 0 ? (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded"
              >
                <div>
                  <div className="font-medium">Team: {inv.team?.name}</div>
                  <div className="text-sm text-gray-600">
                    Game Mode: {inv.team?.gameMode?.name || "Unknown Mode"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Game: {inv.team?.gameMode?.game?.name || "Unknown Game"}
                  </div>
                  <div className="text-sm text-gray-600">
                    From: {inv.from?.nickname || inv.from?.email}
                  </div>
                </div>
                <div className="space-x-2">
                  <button
                    className="bg-green-500 text-white rounded px-3 py-1 text-sm hover:bg-green-600"
                    onClick={() => handleAcceptInvite(inv.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 text-white rounded px-3 py-1 text-sm hover:bg-red-600"
                    onClick={() => handleDeclineInvite(inv.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending team invites</p>
        )}
      </div>
    </div>
  );
}
