export interface LiveMatchPlayer {
  steamId: string;
  nickname: string;
  team: number;
  kills: number;
  deaths: number;
  assists: number;
  mvps: number;
  headshotKills: number;
  damage: number;
  connected: boolean;
}

export interface LiveMatchRound {
  roundNumber: number;
  winner: "team1" | "team2" | "draw";
  team1Score: number;
  team2Score: number;
  duration?: number;
}

export interface LiveMatchInterface {
  matchId: string;
  serverIp?: string;
  serverPort?: number;
  selectedMap?: string;
  status: "loading" | "live" | "ended" | "error";
  currentRound?: number;
  totalRounds?: number;
  team1Score?: number;
  team2Score?: number;
  team1Name?: string;
  team2Name?: string;
  players?: LiveMatchPlayer[];
  roundHistory?: LiveMatchRound[];
  startedAt: string;
}

export interface LiveMatchList {
  matches: LiveMatch[];
  totalCount: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getUserLiveMatches(
  token: string
): Promise<LiveMatchList> {
  const response = await fetch(`${API_BASE_URL}/api/live-matches`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

export async function getLiveMatch(
  matchId: string,
  token: string
): Promise<LiveMatch> {
  const response = await fetch(`${API_BASE_URL}/api/live-matches/${matchId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}
