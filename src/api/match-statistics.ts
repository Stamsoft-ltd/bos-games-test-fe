export interface MatchPlayerStats {
  steamId: string;
  playerName: string;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshots: number;
  plants: number;
  defuses: number;
  weaponsUsed: WeaponStats[];
}

export interface WeaponStats {
  weapon: string;
  kills: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
}

export interface MatchRound {
  roundNumber: number;
  winner: string | null;
  winningTeam: number | null;
  endReason: string | null;
  duration: number | null;
  bombPlanted: boolean;
  bombDefused: boolean;
  bombPlanterSteamId: string | null;
  bombDefuserSteamId: string | null;
  playerStats: MatchPlayerStats[];
  totalDeaths: number;
}

export interface MatchStatistics {
  id: string;
  map: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  totalRounds: number | null;
  duration: number | null;
  winner: string | null;
  gameMode: {
    id: string;
    name: string;
    requiresTeam: boolean;
    playersPerTeam: number;
  };
  teams: Array<{
    id: string;
    teamNumber: number;
    name: string;
    score: number;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
    totalMVPs: number;
    totalHeadshotKills: number;
    totalDamage: number;
  }>;
  players: Array<{
    id: string;
    steamId: string;
    nickname: string;
    teamNumber: number;
    kills: number;
    deaths: number;
    assists: number;
    headshotKills: number;
    mvps: number;
    score: number;
    damage: number;
    doubleKills: number;
    tripleKills: number;
    quadraKills: number;
    pentaKills: number;
    killsWithPistol: number;
    killsWithSniper: number;
    entryAttempts: number;
    entrySuccesses: number;
    flashesThrown: number;
    flashesSuccessful: number;
    flashesEnemiesBlinded: number;
    utilityThrown: number;
    utilityDamage: number;
    oneVsXAttempts: number;
    oneVsXWins: number;
    weaponsUsed?: WeaponStats[];
  }>;
  rounds: MatchRound[];
}

export interface MatchListItem {
  id: string;
  map: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  gameMode: {
    name: string;
  };
  teams: Array<{
    name: string;
    score: number;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getMatchStatistics(
  matchId: string,
  token: string
): Promise<MatchStatistics> {
  const response = await fetch(
    `${API_BASE_URL}/cs2/match-statistics/match/${matchId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

export async function getMatchRounds(
  matchId: string,
  token: string
): Promise<MatchRound[]> {
  const response = await fetch(
    `${API_BASE_URL}/cs2/match-statistics/rounds/${matchId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

export async function getMatchWeapons(
  matchId: string,
  token: string
): Promise<WeaponStats[]> {
  const response = await fetch(
    `${API_BASE_URL}/cs2/match-statistics/weapons/${matchId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

export async function getRecentMatches(
  token: string,
  limit: number = 20
): Promise<MatchListItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/cs2/match-statistics?limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}
