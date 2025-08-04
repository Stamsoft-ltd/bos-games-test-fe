import React from "react";
import { GameModeRating } from "../api/ratings";

interface RatingsDisplayProps {
  ratings: GameModeRating[];
  loading?: boolean;
  error?: string;
}

// Tier color mapping
const getTierColor = (tier: string) => {
  switch (tier.toLowerCase()) {
    case "bronze":
      return "bg-amber-600";
    case "silver":
      return "bg-gray-400";
    case "gold":
      return "bg-yellow-500";
    case "platinum":
      return "bg-cyan-500";
    case "diamond":
      return "bg-purple-500";
    case "master":
      return "bg-red-500";
    case "grandmaster":
      return "bg-pink-500";
    case "legendary":
      return "bg-gradient-to-r from-purple-600 to-pink-600";
    default:
      return "bg-gray-500";
  }
};

// Tier icon mapping
const getTierIcon = (tier: string) => {
  switch (tier.toLowerCase()) {
    case "bronze":
      return "🥉";
    case "silver":
      return "🥈";
    case "gold":
      return "🥇";
    case "platinum":
      return "💎";
    case "diamond":
      return "💠";
    case "master":
      return "👑";
    case "grandmaster":
      return "🏆";
    case "legendary":
      return "⭐";
    default:
      return "🏅";
  }
};

export default function RatingsDisplay({
  ratings,
  loading,
  error,
}: RatingsDisplayProps) {
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">🏆 My Ratings</h2>
        <div className="text-center text-gray-500">Loading ratings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">🏆 My Ratings</h2>
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">🏆 My Ratings</h2>
        <div className="text-center text-gray-500">
          No ratings available yet. Play some matches to get your first rating!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">
        🏆 My Ratings ({ratings.length})
      </h2>
      <div className="space-y-3">
        {ratings.map((rating, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getTierIcon(rating.tier)}</span>
                  <span className="font-medium">{rating.gameModeName}</span>
                  <span className="text-sm text-gray-500">
                    ({rating.gameSlug})
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold text-white ${getTierColor(
                      rating.tier
                    )}`}
                  >
                    {rating.tier.toUpperCase()} {rating.tierLevel}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getTierColor(
                        rating.tier
                      )}`}
                      style={{ width: `${rating.tierProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {rating.tierProgress}%
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  {rating.matchesPlayed} matches played • Last updated:{" "}
                  {new Date(rating.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
