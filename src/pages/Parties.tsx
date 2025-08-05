import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createParty,
  inviteTeamToParty,
  getPartyInvites,
  acceptPartyInvite,
  declinePartyInvite,
  getMyParties,
  setPartyReady,
  unsetPartyReady,
  leaveParty,
  // New solo matchmaking functions
  joinSoloMatchmaking,
  leaveSoloMatchmaking,
  getSoloMatchmakingStatus,
  getAvailableSoloGameModes,
  getMySoloParties,
} from "../api/party";
import { getAllTeams } from "../api/team";
import { getMyRatings, GameModeRating } from "../api/ratings";
import RatingsDisplay from "../components/RatingsDisplay";

export default function PartiesPage() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token") || "";
  const [myParties, setMyParties] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Solo matchmaking state
  const [soloGameModes, setSoloGameModes] = useState<any[]>([]);
  const [mySoloParties, setMySoloParties] = useState<any[]>([]);
  const [soloMatchmakingStatus, setSoloMatchmakingStatus] = useState<
    Record<string, any>
  >({});

  // Ratings state
  const [ratings, setRatings] = useState<GameModeRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState<string>("");

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
        getMyParties(token),
        getPartyInvites(token),
        getAllTeams(token),
        getAvailableSoloGameModes(token),
        getMySoloParties(token),
      ])
        .then(
          ([
            partiesData,
            invitesData,
            teamsData,
            soloGameModesData,
            soloPartiesData,
          ]) => {
            setMyParties(partiesData);
            setInvites(invitesData);
            setTeams(teamsData);
            setSoloGameModes(soloGameModesData);
            setMySoloParties(soloPartiesData);

            // Load matchmaking status for each solo game mode
            loadSoloMatchmakingStatus(soloGameModesData);
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

      // Load ratings separately
      loadRatings();
    }
  }, [token, navigate]);

  // Load solo matchmaking status for all available game modes
  const loadSoloMatchmakingStatus = async (gameModes: any[]) => {
    const statusPromises = gameModes.map(async (gameMode) => {
      try {
        const status = await getSoloMatchmakingStatus(gameMode.id, token);
        return { [gameMode.id]: status };
      } catch (error) {
        console.error(
          `Error loading status for game mode ${gameMode.id}:`,
          error
        );
        return { [gameMode.id]: { isInMatchmaking: false, partyId: null } };
      }
    });

    const statusResults = await Promise.all(statusPromises);
    const combinedStatus = statusResults.reduce(
      (acc, status) => ({ ...acc, ...status }),
      {}
    );
    setSoloMatchmakingStatus(combinedStatus);
  };

  // Load user ratings
  const loadRatings = async () => {
    setRatingsLoading(true);
    setRatingsError("");

    try {
      const ratingsData = await getMyRatings(token);
      setRatings(ratingsData.ratings);
    } catch (error: any) {
      console.error("Error loading ratings:", error);
      setRatingsError(error.message || "Failed to load ratings");
    } finally {
      setRatingsLoading(false);
    }
  };

  async function handleCreateParty() {
    if (!selectedTeam) {
      setStatus("Please select a team for the party");
      return;
    }

    setStatus("Creating party...");
    try {
      const party = await createParty(selectedTeam, token);
      setStatus("Party created successfully!");
      setMyParties((p) => [...p, party]);
      setSelectedTeam("");
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleJoinSoloMatchmaking(gameModeId: string) {
    setStatus("Joining solo matchmaking...");
    try {
      const result = await joinSoloMatchmaking(gameModeId, token);
      setStatus("Joined solo matchmaking successfully!");

      // Update matchmaking status
      setSoloMatchmakingStatus((prev) => ({
        ...prev,
        [gameModeId]: {
          isInMatchmaking: true,
          partyId: result.partyId,
          gameModeId,
        },
      }));

      // Refresh solo parties
      const soloPartiesData = await getMySoloParties(token);
      setMySoloParties(soloPartiesData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleLeaveSoloMatchmaking(gameModeId: string) {
    setStatus("Leaving solo matchmaking...");
    try {
      await leaveSoloMatchmaking(gameModeId, token);
      setStatus("Left solo matchmaking successfully!");

      // Update matchmaking status
      setSoloMatchmakingStatus((prev) => ({
        ...prev,
        [gameModeId]: { isInMatchmaking: false, partyId: null, gameModeId },
      }));

      // Refresh solo parties
      const soloPartiesData = await getMySoloParties(token);
      setMySoloParties(soloPartiesData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleInviteTeam() {
    if (!selectedParty || !selectedTeam) {
      setStatus("Please select both a party and a team");
      return;
    }

    setStatus("Inviting team...");
    try {
      await inviteTeamToParty(selectedParty, selectedTeam, token);
      setStatus("Team invited to party!");
      setSelectedParty("");
      setSelectedTeam("");
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleAcceptInvite(partyId: string) {
    try {
      await acceptPartyInvite(partyId, token);
      setStatus("Party invite accepted!");
      // Refresh data
      const [partiesData, invitesData] = await Promise.all([
        getMyParties(token),
        getPartyInvites(token),
      ]);
      setMyParties(partiesData);
      setInvites(invitesData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleDeclineInvite(partyId: string) {
    try {
      await declinePartyInvite(partyId, token);
      setStatus("Party invite declined");
      // Refresh invites
      const invitesData = await getPartyInvites(token);
      setInvites(invitesData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleReady(partyId: string) {
    try {
      await setPartyReady(partyId, token);
      setStatus("Ready status set!");
      // Refresh parties
      const partiesData = await getMyParties(token);
      setMyParties(partiesData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleUnready(partyId: string) {
    try {
      await unsetPartyReady(partyId, token);
      setStatus("Not ready status set!");
      // Refresh parties
      const partiesData = await getMyParties(token);
      setMyParties(partiesData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  async function handleLeaveParty(partyId: string) {
    try {
      await leaveParty(partyId, token);
      setStatus("Left party successfully!");
      // Refresh parties
      const partiesData = await getMyParties(token);
      setMyParties(partiesData);
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
        <h1 className="text-2xl font-bold">Parties & Matchmaking</h1>
        <Link to="/dashboard" className="text-indigo-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {status && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          {status}
        </div>
      )}

      {/* Ratings Display */}
      <RatingsDisplay
        ratings={ratings}
        loading={ratingsLoading}
        error={ratingsError}
      />

      {/* Solo Matchmaking Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">⚔️ Solo Matchmaking (1v1)</h2>
          <button
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            onClick={() => loadSoloMatchmakingStatus(soloGameModes)}
          >
            Refresh Status
          </button>
        </div>
        {soloGameModes.length > 0 ? (
          <div className="space-y-3">
            {soloGameModes.map((gameMode) => {
              const status = soloMatchmakingStatus[gameMode.id] || {
                isInMatchmaking: false,
              };
              return (
                <div
                  key={gameMode.id}
                  className="p-3 bg-gray-50 rounded border"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{gameMode.name}</div>
                      <div className="text-sm text-gray-600">
                        {gameMode.game?.name} • {gameMode.playersPerTeam}v
                        {gameMode.playersPerTeam}
                      </div>
                      <div className="text-sm text-gray-500">
                        {gameMode.description}
                      </div>
                    </div>
                    <div>
                      {status.isInMatchmaking ? (
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                          onClick={() =>
                            handleLeaveSoloMatchmaking(gameMode.id)
                          }
                        >
                          Leave Matchmaking
                        </button>
                      ) : (
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                          onClick={() => handleJoinSoloMatchmaking(gameMode.id)}
                        >
                          Join Matchmaking
                        </button>
                      )}
                    </div>
                  </div>
                  {status.isInMatchmaking && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      ✓ In matchmaking queue...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No solo game modes available</p>
        )}
      </div>

      {/* My Solo Parties */}
      {mySoloParties.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">
            My Solo Parties ({mySoloParties.length})
          </h2>
          <div className="space-y-3">
            {mySoloParties.map((party, i) => (
              <div key={i} className="p-3 bg-blue-50 rounded border">
                <div className="font-medium">Solo Party ID: {party.id}</div>
                <div className="text-sm text-gray-600">
                  Game Mode: {party.gameMode?.name || "Unknown Mode"}
                </div>
                <div className="text-sm text-gray-600">
                  Game: {party.game?.name || "Unknown Game"}
                </div>
                <div className="text-sm text-gray-600">
                  Status:{" "}
                  {party.isReady ? "Ready for matchmaking" : "Not ready"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Team Party */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">🏆 Create Team Party</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Team:
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a team</option>
              {teams.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
            onClick={handleCreateParty}
            disabled={!selectedTeam}
          >
            Create Team Party
          </button>
        </div>
      </div>

      {/* My Team Parties */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          My Team Parties ({myParties.length})
        </h2>
        {myParties.length > 0 ? (
          <div className="space-y-3">
            {myParties.map((party) => (
              <div key={party.id} className="p-3 bg-gray-50 rounded">
                <div className="font-medium">Party ID: {party.id}</div>
                <div className="text-sm text-gray-600">
                  Team: {party.team?.name || "Unknown Team"}
                </div>
                <div className="text-sm text-gray-600">
                  Game: {party.game?.name || "Unknown Game"}
                </div>
                <div className="text-sm text-gray-600">
                  Game Mode: {party.gameMode?.name || "Unknown Mode"}
                </div>
                <div className="text-sm text-gray-600">
                  Members: {party.memberCount || 0} / Ready:{" "}
                  {party.readyCount || 0}
                </div>
                <div className="mt-2 space-x-2">
                  <button
                    className="bg-green-400 text-white rounded px-3 py-1 text-sm hover:bg-green-500"
                    onClick={() => handleReady(party.id)}
                  >
                    Ready
                  </button>
                  <button
                    className="bg-yellow-400 text-white rounded px-3 py-1 text-sm hover:bg-yellow-500"
                    onClick={() => handleUnready(party.id)}
                  >
                    Not Ready
                  </button>
                  <button
                    className="bg-red-500 text-white rounded px-3 py-1 text-sm hover:bg-red-600"
                    onClick={() => handleLeaveParty(party.id)}
                  >
                    Leave Party
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No team parties created yet. Create your first team party above!
          </p>
        )}
      </div>

      {/* Invite Team to Party */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Invite Team to Party</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Party:
            </label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a party</option>
              {myParties.map((p) => (
                <option value={p.id} key={p.id}>
                  Party {p.id} (Team {p.team?.name || "Unknown Team"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Team:
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a team</option>
              {teams.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700"
            onClick={handleInviteTeam}
            disabled={!selectedParty || !selectedTeam}
          >
            Invite Team
          </button>
        </div>
      </div>

      {/* Party Invites */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          📥 Party Invites ({invites.length})
        </h2>
        {invites.length > 0 ? (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded"
              >
                <div>
                  <div className="font-medium">
                    Invite to Party {inv.party?.id}
                  </div>
                  <div className="text-sm text-gray-600">
                    Team: {inv.party?.teamName || "Unknown Team"}
                  </div>
                  <div className="text-sm text-gray-600">
                    From: {inv.sender?.nickname || inv.sender?.email}
                  </div>
                </div>
                <div className="space-x-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    onClick={() => handleAcceptInvite(inv.party?.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    onClick={() => handleDeclineInvite(inv.party?.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending party invites</p>
        )}
      </div>
    </div>
  );
}
