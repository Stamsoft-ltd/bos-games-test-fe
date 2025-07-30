import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create a party with teamId
export const createParty = async (teamId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties`,
    { teamId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Create a solo party (without queueing)
export const createSoloParty = async (gameModeId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/solo`,
    { gameModeId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Join solo matchmaking (creates party and queues in one request)
export const joinSoloMatchmaking = async (
  gameModeId: string,
  token: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/solo/join-matchmaking`,
    { gameModeId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Leave solo matchmaking
export const leaveSoloMatchmaking = async (
  gameModeId: string,
  token: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/solo/leave-matchmaking`,
    { gameModeId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Get solo matchmaking status
export const getSoloMatchmakingStatus = async (
  gameModeId: string,
  token: string
) => {
  const response = await axios.get(
    `${API_BASE_URL}/parties/solo/matchmaking-status/${gameModeId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get available solo game modes
export const getAvailableSoloGameModes = async (token: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/parties/solo/available-game-modes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get my solo parties
export const getMySoloParties = async (token: string) => {
  const response = await axios.get(`${API_BASE_URL}/parties/solo`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Invite team to party
export const inviteTeamToParty = async (
  partyId: string,
  teamId: string,
  token: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/${partyId}/invite-team/${teamId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Get party invites
export const getPartyInvites = async (token: string) => {
  const response = await axios.get(`${API_BASE_URL}/parties/invites`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Accept party invite
export const acceptPartyInvite = async (partyId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/${partyId}/accept`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Decline party invite
export const declinePartyInvite = async (partyId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/${partyId}/decline`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Get my parties
export const getMyParties = async (token: string) => {
  const response = await axios.get(`${API_BASE_URL}/parties/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Set ready
export const setPartyReady = async (partyId: string, token: string) => {
  console.log(`${API_BASE_URL}/parties/${partyId}/ready`);
  const response = await axios.post(
    `${API_BASE_URL}/parties/${partyId}/ready`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Unset ready
export const unsetPartyReady = async (partyId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/${partyId}/unready`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Leave party
export const leaveParty = async (partyId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/parties/${partyId}/leave`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
