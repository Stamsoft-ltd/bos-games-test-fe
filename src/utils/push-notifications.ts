import { setPushToken, removePushToken } from "../api/push-tokens";
import { firebaseConfig, vapidKey } from "../config/firebase";

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean;
  private messaging: any = null;

  private constructor() {
    this.isSupported = "serviceWorker" in navigator && "PushManager" in window;

    console.log("PushNotificationService initialized:", {
      isSupported: this.isSupported,
      vapidKeyStatus: vapidKey,
    });

    if (!this.isSupported) {
      console.warn("Push notifications not supported in this browser");
    }
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    console.log("Requesting push notification permission...");

    if (!this.isSupported) {
      console.warn("Push notifications not supported in this browser");
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log("Push notification permission result:", permission);
    return permission === "granted";
  }

  async initializeFirebase(): Promise<boolean> {
    try {
      // Dynamically import Firebase
      const { initializeApp } = await import("firebase/app");
      const { getMessaging, getToken, onMessage } = await import(
        "firebase/messaging"
      );

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);

      // Set up foreground message handler
      onMessage(this.messaging, (payload) => {
        console.log("Received foreground message:", payload);
        console.log("Foreground payload data:", payload.data);
        console.log("Foreground payload notification:", payload.notification);
        console.log("Foreground action check:", payload.data?.action);
        console.log("Foreground matchId check:", payload.data?.matchId);

        // If this is a match acceptance notification, trigger the modal
        if (payload.data?.action === "accept_match" && payload.data?.matchId) {
          console.log(
            "Foreground match notification received, triggering modal"
          );

          // Dispatch a custom event that the main app can listen to
          const event = new CustomEvent("matchFound", {
            detail: {
              matchId: payload.data.matchId,
            },
          });
          window.dispatchEvent(event);
        } else if (
          payload.data?.action === "match_started" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground match started notification received, triggering server connection modal"
          );

          // Dispatch a custom event that the main app can listen to
          const event = new CustomEvent("matchFound", {
            detail: {
              type: "MATCH_STARTED",
              matchId: payload.data.matchId,
              serverIp: payload.data.serverIp,
              serverPort: payload.data.serverPort,
            },
          });
          window.dispatchEvent(event);
        } else {
          console.log(
            "Foreground message received but not a match acceptance or match started notification"
          );
        }
      });

      console.log("Firebase initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      return false;
    }
  }

  async subscribeToPush(authToken: string): Promise<string | null> {
    console.log("Subscribing to push notifications...");

    if (!this.messaging) {
      console.error("Firebase messaging not initialized");
      return null;
    }

    try {
      console.log("Getting Firebase messaging token...");

      const { getToken } = await import("firebase/messaging");

      const token = await getToken(this.messaging, {
        vapidKey: vapidKey,
      });

      if (token) {
        console.log("Firebase messaging token obtained:", token);
        console.log("Sending push token to backend:", token);
        await setPushToken(token, authToken);
        console.log("Push token registered successfully:", token);
        return token;
      } else {
        console.error("Failed to get Firebase messaging token");
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      // Provide specific guidance for VAPID key errors
      if (
        error.message &&
        error.message.includes("applicationServerKey is not valid")
      ) {
        console.error(
          "VAPID key is invalid. Please check your VAPID key configuration."
        );
        console.error(
          "Make sure you've copied the correct public key from Firebase Console."
        );
        console.error("Current VAPID key:", vapidKey);
      }
    }

    return null;
  }

  async unsubscribeFromPush(authToken: string): Promise<void> {
    console.log("Unsubscribing from push notifications...");

    if (!this.messaging) return;

    try {
      const { deleteToken } = await import("firebase/messaging");
      await deleteToken(this.messaging);
      console.log("Unsubscribed from push notifications successfully");
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
    }
  }

  async initialize(authToken: string): Promise<boolean> {
    console.log("Initializing push notification service...");

    if (!this.isSupported) {
      console.warn("Push notifications not supported in this browser");
      return false;
    }

    const hasPermission = await this.requestPermission();
    console.log("Push permission status:", hasPermission);
    if (!hasPermission) {
      console.warn("Push notification permission denied");
      return false;
    }

    const firebaseInitialized = await this.initializeFirebase();
    if (!firebaseInitialized) {
      console.error("Failed to initialize Firebase");
      return false;
    }

    const token = await this.subscribeToPush(authToken);
    if (!token) {
      console.error("Failed to subscribe to push notifications");
      return false;
    }

    console.log("Push notification service initialized successfully");
    return true;
  }

  // Method to test if service worker is working
  async testServiceWorker(): Promise<boolean> {
    try {
      // Check if Firebase messaging service worker is registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      const firebaseSW = registrations.find(
        (reg) =>
          reg.scope.includes("firebase-cloud-messaging-push-scope") ||
          reg.active?.scriptURL.includes("firebase-messaging-sw.js")
      );

      console.log("Service worker registrations:", registrations);
      console.log("Firebase messaging service worker found:", !!firebaseSW);

      return !!firebaseSW;
    } catch (error) {
      console.error("Error testing service worker:", error);
      return false;
    }
  }
}
