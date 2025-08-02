import React, { useEffect, useState, useRef } from "react";
import { MapBanSession, banMap } from "../api/map-banning";

interface MapBanningModalProps {
  isVisible: boolean;
  session: MapBanSession | null;
  currentUserId: string;
  token: string;
  onMapSelected: (selectedMap: string) => void;
  onTimeout: () => void;
  onClose: () => void;
}

const MapBanningModal: React.FC<MapBanningModalProps> = ({
  isVisible,
  session,
  currentUserId,
  token,
  onMapSelected,
  onTimeout,
  onClose,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds for map banning
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track timer state and prevent resets
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTurnRef = useRef<string | null>(null);
  const timerStartedRef = useRef<boolean>(false);

  // Check if it's the current user's turn to ban
  const isCurrentUserTurn =
    session?.leaderIds[session.currentLeaderIndex] === currentUserId;

  // Debug logging
  console.log("MapBanningModal debug:", {
    currentUserId,
    session: session
      ? {
          matchId: session.matchId,
          currentLeaderIndex: session.currentLeaderIndex,
          leaderIds: session.leaderIds,
          currentLeader: session.leaderIds[session.currentLeaderIndex],
          availableMaps: session.availableMaps,
          bannedMaps: session.bannedMaps,
          isComplete: session.isComplete,
          selectedMap: session.selectedMap,
        }
      : null,
    isCurrentUserTurn,
    isVisible,
    timeRemaining,
  });

  // Check if session is complete and close modal if needed
  useEffect(() => {
    if (session?.isComplete) {
      console.log("Map banning session is complete, closing modal");
      // Clear timer when session completes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerStartedRef.current = false;
      currentTurnRef.current = null; // Reset turn reference
      onClose();
    }
  }, [session?.isComplete, onClose]);

  // Cleanup timer when modal closes
  useEffect(() => {
    if (!isVisible) {
      console.log("Modal closed, cleaning up timer");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerStartedRef.current = false;
      currentTurnRef.current = null;
    }
  }, [isVisible]);

  // Debug logging for session changes
  useEffect(() => {
    if (session) {
      console.log("MapBanningModal session updated:", {
        matchId: session.matchId,
        currentLeaderIndex: session.currentLeaderIndex,
        leaderIds: session.leaderIds,
        currentLeader: session.leaderIds[session.currentLeaderIndex],
        availableMaps: session.availableMaps,
        bannedMaps: session.bannedMaps,
        isComplete: session.isComplete,
        selectedMap: session.selectedMap,
        isCurrentUserTurn,
        timeRemaining,
      });

      // Handle session updates from push notifications
      const currentLeader = session.leaderIds[session.currentLeaderIndex];
      const isCurrentUserTurnForSession = currentLeader === currentUserId;

      // If it's not the current user's turn, reset timer display
      if (!isCurrentUserTurnForSession) {
        console.log("Session update: Not user's turn, resetting timer display");
        setTimeRemaining(30);
      }
    }
  }, [session, isCurrentUserTurn, timeRemaining, currentUserId]);

  // Countdown timer effect
  useEffect(() => {
    if (!isVisible || !session) return;

    const currentLeader = session.leaderIds[session.currentLeaderIndex];
    const isCurrentUserTurnForTimer = currentLeader === currentUserId;

    console.log("Timer effect triggered:", {
      isVisible,
      sessionMatchId: session?.matchId,
      currentLeaderIndex: session?.currentLeaderIndex,
      currentLeader: session?.leaderIds?.[session?.currentLeaderIndex],
      isCurrentUserTurnForTimer,
      timerStarted: timerStartedRef.current,
      currentTurnRef: currentTurnRef.current,
    });

    // Only start timer if it's the current user's turn and timer hasn't started for this turn
    if (!isCurrentUserTurnForTimer) {
      console.log("Not user's turn, not starting timer");
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerStartedRef.current = false;
      // Reset timer display when it's not user's turn
      setTimeRemaining(30);
      return;
    }

    // Check if turn has changed (new leader)
    const hasTurnChanged =
      currentTurnRef.current !== null &&
      currentTurnRef.current !== currentLeader;
    if (hasTurnChanged) {
      console.log(
        "Turn changed from",
        currentTurnRef.current,
        "to",
        currentLeader
      );
      // Reset timer state for new turn
      timerStartedRef.current = false;
      currentTurnRef.current = null;
    }

    // Check if timer is already running for this turn
    if (timerStartedRef.current && currentTurnRef.current === currentLeader) {
      console.log("Timer already running for this turn, not restarting");
      return;
    }

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    console.log("Starting map banning timer for session:", session.matchId);
    console.log("Timer state reset - new turn detected");
    setTimeRemaining(30);
    setIsLoading(false);
    setError(null);

    // Mark timer as started for this turn
    timerStartedRef.current = true;
    currentTurnRef.current = currentLeader;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        console.log("Timer tick:", prev, "seconds remaining");
        if (prev <= 1) {
          console.log("Timer expired, calling onTimeout");
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          timerStartedRef.current = false;
          currentTurnRef.current = null; // Reset turn reference
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log("Clearing timer interval");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerStartedRef.current = false;
    };
  }, [
    isVisible,
    session?.currentLeaderIndex,
    session?.leaderIds,
    currentUserId,
    onTimeout,
  ]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get progress percentage for the progress bar
  const getProgressPercentage = (): number => {
    return ((30 - timeRemaining) / 30) * 100;
  };

  // Get color based on time remaining
  const getTimeColor = (): string => {
    if (timeRemaining > 20) return "text-green-600";
    if (timeRemaining > 10) return "text-yellow-600";
    return "text-red-600";
  };

  const handleBanMap = async (mapSlug: string) => {
    if (!session || !isCurrentUserTurn) {
      console.log("Cannot ban map - not user's turn or no session", {
        hasSession: !!session,
        isCurrentUserTurn,
        currentUserId,
        currentLeader: session?.leaderIds?.[session?.currentLeaderIndex],
      });
      return;
    }

    console.log("Banning map:", {
      mapSlug,
      matchId: session.matchId,
      currentUserId,
      currentLeaderIndex: session.currentLeaderIndex,
    });

    setIsLoading(true);
    setError(null);

    try {
      const result = await banMap(
        session.matchId,
        currentUserId,
        mapSlug,
        token
      );
      console.log("Map ban request successful:", result);

      // Call the onMapSelected callback to notify parent component
      onMapSelected(mapSlug);

      // Don't set loading to false here - let the session update handle it
      // The session will be updated via the notification system
    } catch (error) {
      console.error("Error banning map:", error);
      setError("Failed to ban map. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isVisible || !session) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Map Banning Phase
          </h2>
          <p className="text-gray-600 mb-4">
            {isCurrentUserTurn
              ? "It's your turn to ban a map!"
              : "Waiting for other players to ban maps..."}
          </p>

          {/* Timer */}
          <div className="mb-4">
            <div className="text-3xl font-bold mb-2">
              <span className={getTimeColor()}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Session info */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Available Maps:</span>
              <div className="mt-1">
                {session.availableMaps.length} remaining
              </div>
            </div>
            <div>
              <span className="font-semibold">Banned Maps:</span>
              <div className="mt-1">{session.bannedMaps.length} banned</div>
            </div>
          </div>
        </div>

        {/* Available maps grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Available Maps</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {session.availableMaps.map((mapSlug) => (
              <button
                key={mapSlug}
                onClick={() => handleBanMap(mapSlug)}
                disabled={!isCurrentUserTurn || isLoading}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200
                  ${
                    isCurrentUserTurn && !isLoading
                      ? "border-blue-500 hover:bg-blue-50 cursor-pointer"
                      : "border-gray-300 bg-gray-100 cursor-not-allowed"
                  }
                `}
              >
                <div className="font-medium text-gray-800 capitalize">
                  {mapSlug.replace(/_/g, " ")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Banned maps */}
        {session.bannedMaps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Banned Maps</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {session.bannedMaps.map((mapSlug) => (
                <div
                  key={mapSlug}
                  className="p-3 rounded-lg border-2 border-red-300 bg-red-50"
                >
                  <div className="font-medium text-red-800 capitalize line-through">
                    {mapSlug.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Processing...</span>
          </div>
        )}

        {/* Close button */}
        <div className="text-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapBanningModal;
