// Utility to test background message modal triggering
export class BackgroundMessageTest {
  // Simulate a background match notification
  static async simulateBackgroundMatchNotification(
    matchId: string = "test-match-123"
  ) {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      console.error("Service worker not available");
      return;
    }

    console.log("Simulating background match notification for:", matchId);

    // Create a mock background message payload
    const mockPayload = {
      notification: {
        title: "Match Found!",
        body: "A match is ready to start. Accept within the time limit!",
      },
      data: {
        action: "accept_match",
        matchId: matchId,
        tag: "match_notification",
      },
    };

    // Send the mock payload to the service worker
    navigator.serviceWorker.controller.postMessage({
      type: "SIMULATE_BACKGROUND_MESSAGE",
      payload: mockPayload,
    });

    console.log("Background match notification simulation sent");
  }

  // Check if there's pending match data in the service worker
  static async checkPendingMatchData(): Promise<any> {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      console.error("Service worker not available");
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        console.log("Received pending match data:", event.data);
        resolve(event.data);
      };

      navigator.serviceWorker.controller?.postMessage(
        { type: "CHECK_PENDING_MATCH" },
        [messageChannel.port2]
      );
    });
  }

  // Clear any pending match data
  static async clearPendingMatchData() {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      console.error("Service worker not available");
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: "CLEAR_PENDING_MATCH",
    });

    console.log("Pending match data cleared");
  }

  // Simple test to verify basic functionality
  static async testBasicModalTriggering() {
    console.log("=== Testing Basic Modal Triggering ===");

    // Step 1: Simulate background message
    console.log("1. Simulating background match notification...");
    await this.simulateBackgroundMatchNotification("test-basic-123");

    // Step 2: Wait a moment for processing
    setTimeout(() => {
      console.log("2. Modal should appear if tab is focused");
      console.log("3. If modal appears, basic functionality is working!");
    }, 1000);
  }

  // Test foreground message handling
  static async testForegroundMessage() {
    console.log("=== Testing Foreground Message Handling ===");

    // Simulate a foreground message by dispatching the custom event
    const event = new CustomEvent("matchFound", {
      detail: {
        matchId: "test-foreground-123",
      },
    });

    console.log("1. Dispatching foreground match event...");
    window.dispatchEvent(event);

    console.log("2. Modal should appear immediately (foreground message)");
  }

  // Test match started notification
  static async testMatchStartedNotification() {
    console.log("=== Testing Match Started Notification ===");

    // Simulate a match started notification
    const event = new CustomEvent("matchFound", {
      detail: {
        type: "MATCH_STARTED",
        matchId: "test-match-started-123",
        serverIp: "192.168.1.100",
        serverPort: 27015,
      },
    });

    console.log("1. Dispatching match started event...");
    window.dispatchEvent(event);

    console.log("2. Server connection modal should appear immediately");
  }

  // Test the complete background message flow
  static async testCompleteFlow() {
    console.log("=== Testing Complete Background Message Flow ===");

    // Step 1: Simulate background message
    console.log("1. Simulating background match notification...");
    await this.simulateBackgroundMatchNotification("test-complete-flow-123");

    // Step 2: Check if data was stored
    console.log("2. Checking if data was stored...");
    const pendingData = await this.checkPendingMatchData();
    console.log("Pending data:", pendingData);

    // Step 3: Simulate app focus
    console.log("3. Simulating app focus...");
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CLIENT_FOCUSED",
      });
    }

    // Step 4: Wait a bit and check again
    setTimeout(async () => {
      console.log("4. Checking data after focus simulation...");
      const dataAfterFocus = await this.checkPendingMatchData();
      console.log("Data after focus:", dataAfterFocus);

      // Step 5: Clean up
      console.log("5. Cleaning up...");
      await this.clearPendingMatchData();
      console.log("=== Test Complete ===");
    }, 1000);
  }

  // Test modal triggering when tab is not selected
  static async testTabNotSelected() {
    console.log("=== Testing Modal Triggering When Tab Not Selected ===");

    // Step 1: Simulate background message
    console.log("1. Simulating background match notification...");
    await this.simulateBackgroundMatchNotification("test-tab-not-selected-123");

    console.log(
      "2. Now switch to another tab and come back to test modal triggering"
    );
    console.log("3. The modal should appear when you return to this tab");

    // Instructions for manual testing
    console.log("=== Manual Test Instructions ===");
    console.log('1. Click "🎯 Test BG Modal" button');
    console.log("2. Switch to another browser tab");
    console.log("3. Switch back to this tab");
    console.log("4. Modal should appear automatically");
  }
}
