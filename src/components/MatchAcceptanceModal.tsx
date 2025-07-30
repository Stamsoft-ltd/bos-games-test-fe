import React, { useEffect, useState } from "react";

interface MatchAcceptanceModalProps {
  isVisible: boolean;
  timeRemaining: number;
  onAccept: () => void;
  onDecline: () => void;
  onTimeout: () => void;
}

const MatchAcceptanceModal: React.FC<MatchAcceptanceModalProps> = ({
  isVisible,
  timeRemaining: initialTimeRemaining,
  onAccept,
  onDecline,
  onTimeout,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (!isVisible) return;

    setTimeRemaining(initialTimeRemaining);
    setIsLoading(false);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, initialTimeRemaining, onTimeout]);

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
    return (
      ((initialTimeRemaining - timeRemaining) / initialTimeRemaining) * 100
    );
  };

  // Get color based on time remaining
  const getTimeColor = (): string => {
    if (timeRemaining > 20) return "text-green-600";
    if (timeRemaining > 10) return "text-yellow-600";
    return "text-red-600";
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
    } catch (error) {
      console.error("Error accepting match:", error);
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      await onDecline();
    } catch (error) {
      console.error("Error declining match:", error);
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Match Found!
          </h2>
          <p className="text-gray-600">
            A match is ready to start. Accept within the time limit to join!
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="text-center mb-6">
          <div
            className={`text-4xl font-mono font-bold ${getTimeColor()} mb-2`}
          >
            {formatTime(timeRemaining)}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>

          <p className="text-sm text-gray-500">Time remaining to accept</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="mr-2">❌</span>
                Decline
              </>
            )}
          </button>

          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span className="mr-2">✅</span>
                Accept
              </>
            )}
          </button>
        </div>

        {/* Warning Message */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            ⚠️ If you don't respond in time, the match will be cancelled
          </p>
        </div>
      </div>
    </div>
  );
};

export default MatchAcceptanceModal;
