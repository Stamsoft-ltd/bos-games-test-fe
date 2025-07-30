import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create team
export const createTeam = async (
  name: string,
  gameModeId: string,
  inviteeIds: string[],
  token: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/teams`,
    { name, gameModeId, inviteeIds },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Get teams for a specific game mode
export const getTeams = async (gameModeId: string, token: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/teams/game-mode/${gameModeId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get all teams for the user
export const getAllTeams = async (token: string) => {
  const response = await axios.get(`${API_BASE_URL}/teams`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Invite user to team
export const inviteToTeam = async (
  teamId: string,
  userId: string,
  token: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/team-invites/${teamId}/${userId}`,
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

// Get received team invites
export const getReceivedTeamInvites = async (token: string) => {
  const response = await axios.get(`${API_BASE_URL}/team-invites/received`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Accept team invite
export const acceptTeamInvite = async (inviteId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/team-invites/${inviteId}/accept`,
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

// Decline team invite
export const declineTeamInvite = async (inviteId: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/team-invites/${inviteId}/decline`,
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

// Invite friend to existing team
export const inviteFriendToTeam = async (
  teamId: string,
  friendId: string,
  token: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/teams/${teamId}/invite-friend/${friendId}`,
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
