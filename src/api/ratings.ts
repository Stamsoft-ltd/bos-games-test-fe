const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface GameModeRating {
  gameModeName: string;
  gameSlug: string;
  tier: string;
  tierLevel: number;
  tierProgress: number;
  matchesPlayed: number;
  lastUpdated: string;
}

export interface UserRatingsResponse {
  userId: string;
  ratings: GameModeRating[];
  totalGameModes: number;
}

/**
 * Get all ratings for the authenticated user
 */
export async function getMyRatings(
  token: string
): Promise<UserRatingsResponse> {
  const response = await fetch(`${API_BASE_URL}/ratings/my-ratings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ratings: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get rating for a specific game mode
 */
export async function getMyGameModeRating(
  gameModeId: string,
  token: string
): Promise<GameModeRating | null> {
  const response = await fetch(
    `${API_BASE_URL}/ratings/my-ratings/${gameModeId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch game mode rating: ${response.statusText}`);
  }

  return response.json();
}
