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
  const steamUrl = `steam://run/730//+connect ${serverIp}:${serverPort}`;
  const steamConnectUrl = `steam://connect/${serverIp}:${serverPort}`;

  console.log("Attempting to connect to CS2 server:", {
    serverIp,
    serverPort,
    steamUrl,
    steamConnectUrl,
  });

  // Try multiple approaches to handle fullscreen game focus
  const tryConnect = async () => {
    try {
      // First attempt: Try the run command (launches if not running, connects if running)
      console.log("Attempt 1: Using steam://run command");
      window.open(steamUrl, "_blank");

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Wait a moment then try alternative approach
      setTimeout(() => {
        try {
          // Second attempt: Try direct connect (may work better with fullscreen)
          console.log("Attempt 2: Using steam://connect command");
          window.open(steamConnectUrl, "_blank");
        } catch (error) {
          console.log("Direct connect failed:", error);
          // Third attempt: Fallback to current window
          try {
            console.log("Attempt 3: Using current window");
            window.location.href = steamUrl;
          } catch (fallbackError) {
            console.error("All connection attempts failed:", fallbackError);

            // Show user instructions for manual connection
            const manualInstructions = `Unable to automatically connect to CS2.

Please manually connect to:
${serverIp}:${serverPort}

If CS2 is running in fullscreen, try:
1. Alt+Tab to CS2
2. Press F12 to open console
3. Type: connect ${serverIp}:${serverPort}

Alternative methods:
- Press ~ (tilde) to open console in CS2
- Type: connect ${serverIp}:${serverPort}
- Or use Steam's "Connect to Server" feature`;

            if (onError) {
              onError(manualInstructions);
            } else {
              alert(manualInstructions);
            }
          }
        }
      }, 1000);
    } catch (error) {
      console.log("Initial connection attempt failed:", error);
      // Try direct connect as fallback
      try {
        window.open(steamConnectUrl, "_blank");
        if (onSuccess) {
          onSuccess();
        }
      } catch (directError) {
        console.error("Direct connect also failed:", directError);
        window.location.href = steamUrl;
      }
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
