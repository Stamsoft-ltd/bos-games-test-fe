import React from "react";

interface ServerConnectionModalProps {
  isVisible: boolean;
  serverIp?: string;
  serverPort?: number;
  matchId: string;
  selectedMap?: string;
  isLoadingConnectionDetails?: boolean;
  onClose: () => void;
  onCopyConnectionInfo: () => void;
  onLaunchGame?: () => void;
}

const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({
  isVisible,
  serverIp,
  serverPort,
  matchId,
  selectedMap,
  isLoadingConnectionDetails = false,
  onClose,
  onCopyConnectionInfo,
  onLaunchGame,
}) => {
  if (!isVisible) return null;

  const connectionString =
    serverIp && serverPort ? `${serverIp}:${serverPort}` : "";

  const handleCopyConnectionInfo = async () => {
    if (!connectionString) {
      console.log("No connection string available to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(connectionString);
      onCopyConnectionInfo();
    } catch (error) {
      console.error("Failed to copy connection info:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = connectionString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      onCopyConnectionInfo();
    }
  };

  const handleLaunchGame = () => {
    if (!serverIp || !serverPort) {
      console.log("Server details not available");
      return;
    }

    // Use steam://connect to try connecting to already running CS2 first
    // If CS2 is not running, it will launch it automatically
    const steamUrl = `steam://connect/${serverIp}:${serverPort}`;

    try {
      // Try to open the Steam URL
      window.location.href = steamUrl;

      // Call the callback if provided
      if (onLaunchGame) {
        onLaunchGame();
      }

      console.log("Connecting to CS2 server...");
    } catch (error) {
      console.error("Failed to connect to game:", error);
      // Fallback: copy connection string and show instructions
      handleCopyConnectionInfo();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              🎮 Match Started!
            </h2>
            <p className="text-gray-600 text-sm">
              Your match is ready. Connect to the server below.
            </p>
          </div>

          {/* Selected Map */}
          {selectedMap && (
            <div className="bg-green-50 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-semibold text-green-800 mb-1">
                🗺️ Selected Map
              </h3>
              <div className="text-lg font-bold text-green-900 capitalize">
                {selectedMap.replace(/_/g, " ")}
              </div>
            </div>
          )}

          {/* Server Connection Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Server Connection Details
            </h3>

            {isLoadingConnectionDetails ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Server Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">
                          Loading server details...
                        </span>
                      </div>
                    </div>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-400 text-gray-600 rounded-md cursor-not-allowed text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IP Address
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500 text-sm">
                          Loading...
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500 text-sm">
                          Loading...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Server Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={connectionString}
                      readOnly
                      className="flex-1 px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-900 font-mono text-xs"
                    />
                    <button
                      onClick={handleCopyConnectionInfo}
                      disabled={!connectionString}
                      className={`px-3 py-1 rounded-md transition-colors text-xs ${
                        connectionString
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      IP Address
                    </label>
                    <div className="px-2 py-1 bg-white border border-gray-300 rounded-md font-mono text-xs">
                      {serverIp || "Not available"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <div className="px-2 py-1 bg-white border border-gray-300 rounded-md font-mono text-xs">
                      {serverPort || "Not available"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Match ID */}
          <div className="bg-blue-50 rounded-lg p-2 mb-4">
            <label className="block text-xs font-medium text-blue-800 mb-1">
              Match ID
            </label>
            <div className="font-mono text-xs text-blue-900 break-all">
              {matchId}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              How to Connect:
            </h4>
            <div className="text-xs text-yellow-700 space-y-2">
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <p className="font-semibold text-green-800 mb-1 text-xs">
                  🚀 Quick Connect:
                </p>
                <p className="text-green-700 text-xs">
                  Click "Launch CS2 & Connect" above to automatically open the
                  game and connect to the server.
                </p>
              </div>
              <div>
                <p className="font-semibold text-yellow-800 mb-1 text-xs">
                  Manual Connect:
                </p>
                <ol className="space-y-1 text-left text-xs">
                  <li>1. Open Counter-Strike 2</li>
                  <li>2. Go to "Play" → "Community Servers"</li>
                  <li>3. Click "Connect to a server"</li>
                  <li>4. Enter the server address above</li>
                  <li>5. Click "Connect"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Launch Game Button */}
            <button
              onClick={handleLaunchGame}
              disabled={!connectionString || isLoadingConnectionDetails}
              className={`w-full px-3 py-2 rounded-md transition-colors font-semibold text-sm ${
                connectionString && !isLoadingConnectionDetails
                  ? "bg-orange-600 text-white hover:bg-orange-700 shadow-lg"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              🎮 Launch CS2 & Connect
            </button>

            {/* Secondary Actions */}
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={handleCopyConnectionInfo}
                disabled={!connectionString || isLoadingConnectionDetails}
                className={`flex-1 px-3 py-2 rounded-md transition-colors text-sm ${
                  connectionString && !isLoadingConnectionDetails
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
              >
                Copy & Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConnectionModal;
