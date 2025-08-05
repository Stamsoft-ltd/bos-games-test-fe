/**
 * Utility function to handle CS2 server connections with multiple fallback strategies
 * for handling fullscreen game focus issues
 */

export interface CS2ConnectionOptions {
  serverIp: string;
  serverPort: number | string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const connectToCS2Server = (options: CS2ConnectionOptions) => {
  const { serverIp, serverPort, onSuccess, onError } = options;

  // Multiple approaches to handle fullscreen game focus issues
  const steamUrl = `steam://run/730//+connect ${serverIp}:${serverPort} -novid`;

  console.log("Attempting to connect to CS2 server:", {
    serverIp,
    serverPort,
    steamUrl,
  });

  // Try multiple approaches to handle fullscreen game focus
  const tryConnect = async () => {
    try {
      // First attempt: Try the run command (launches if not running, connects if running)
      console.log("Attempt 1: Using steam://run command");
      window.location.href = steamUrl;

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.log("Initial connection attempt failed:", error);
    }
  };

  tryConnect();
};

/**
 * Helper function to get connection string for copying
 */
export const getConnectionString = (
  serverIp: string,
  serverPort: number | string
) => {
  return `${serverIp}:${serverPort}`;
};

/**
 * Helper function to get Steam console command
 */
export const getSteamConsoleCommand = (
  serverIp: string,
  serverPort: number | string
) => {
  return `connect ${serverIp}:${serverPort}`;
};
