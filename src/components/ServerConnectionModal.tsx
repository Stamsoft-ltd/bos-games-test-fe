import React from "react";

interface ServerConnectionModalProps {
  isVisible: boolean;
  serverIp: string;
  serverPort: number;
  matchId: string;
  onClose: () => void;
  onCopyConnectionInfo: () => void;
}

const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({
  isVisible,
  serverIp,
  serverPort,
  matchId,
  onClose,
  onCopyConnectionInfo,
}) => {
  if (!isVisible) return null;

  const connectionString = `${serverIp}:${serverPort}`;

  const handleCopyConnectionInfo = async () => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🎮 Match Started!
            </h2>
            <p className="text-gray-600">
              Your match is ready. Connect to the server below.
            </p>
          </div>

          {/* Server Connection Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Server Connection Details
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server Address
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={connectionString}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyConnectionInfo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
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
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm">
                    {serverIp}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <div className="px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm">
                    {serverPort}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match ID */}
          <div className="bg-blue-50 rounded-lg p-3 mb-6">
            <label className="block text-sm font-medium text-blue-800 mb-1">
              Match ID
            </label>
            <div className="font-mono text-sm text-blue-900 break-all">
              {matchId}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-800 mb-2">
              How to Connect:
            </h4>
            <ol className="text-sm text-yellow-700 space-y-1 text-left">
              <li>1. Open Counter-Strike 2</li>
              <li>2. Go to "Play" → "Community Servers"</li>
              <li>3. Click "Connect to a server"</li>
              <li>4. Enter the server address above</li>
              <li>5. Click "Connect"</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCopyConnectionInfo}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Copy & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConnectionModal;
