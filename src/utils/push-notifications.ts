import {
  setPushToken,
  removePushToken,
  PlatformEnum,
} from "../api/push-tokens";
import { firebaseConfig, vapidKey } from "../config/firebase";
import { getDeviceId } from "./device-id";

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

  /**
   * Detect the current platform
   */
  private detectPlatform(): PlatformEnum {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      return PlatformEnum.IOS;
    } else if (/android/.test(userAgent)) {
      return PlatformEnum.ANDROID;
    } else if (/windows/.test(userAgent)) {
      return PlatformEnum.WINDOWS;
    } else {
      return PlatformEnum.WEB;
    }
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

        if (payload?.data?.data) {
          console.log("Foreground message data:", payload.data.data);
          try {
            payload.data.data = JSON.parse(payload.data.data);
          } catch (e) {
            console.error(
              "Failed to parse data field in foreground message",
              e
            );
          }
        }

        // If this is a match acceptance notification, trigger the modal
        if (payload.data?.type === "match_found" && payload.data?.matchId) {
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
          payload.data?.type === "match_started" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground match started notification received, triggering server connection modal"
          );

          // Dispatch a custom event that the main app can listen to
          const event = new CustomEvent("matchFound", {
            detail: {
              type: "match_started",
              matchId: payload.data.matchId,
              serverIp: payload.data.serverIp,
              serverPort: payload.data.serverPort,
              selectedMap: payload.data.selectedMap,
            },
          });
          window.dispatchEvent(event);
        } else if (
          payload.data?.type === "map_banning_started" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground map banning started notification received, triggering map banning modal"
          );

          // Dispatch a custom event that the main app can listen to
          const event = new CustomEvent("matchFound", {
            detail: {
              type: "map_banning_started",
              matchId: payload.data.matchId,
            },
          });
          window.dispatchEvent(event);
        } else if (
          payload.data?.type === "map_banned" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground map banned notification received, updating map banning modal"
          );

          // Dispatch a custom event that the main app can listen to
          const event = new CustomEvent("matchFound", {
            detail: {
              type: "map_banned",
              matchId: payload.data.matchId,
              bannedMap: payload.data.bannedMap,
              remainingMaps: payload.data.remainingMaps,
            },
          });
          window.dispatchEvent(event);
        } else if (
          payload.data?.type === "map_banning_complete" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground map banning complete notification received, closing map banning modal"
          );

          // Dispatch a custom event that the main app can listen to
          const event = new CustomEvent("matchFound", {
            detail: {
              type: "map_banning_complete",
              matchId: payload.data.matchId,
              selectedMap: payload.data.selectedMap,
            },
          });
          window.dispatchEvent(event);
        } else if (
          payload.data?.type === "round_completed" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground round completed notification received, updating live match"
          );
          console.log("Round completion data:", payload.data);

          // Parse the data properly
          let parsedData;
          try {
            parsedData =
              typeof payload.data.data === "string"
                ? JSON.parse(payload.data.data)
                : payload.data.data;
          } catch (error) {
            console.error("Failed to parse payload data:", error);
            parsedData = null;
          }

          // Dispatch a custom event for round end
          const roundEndEvent = new CustomEvent("round-end", {
            detail: {
              matchId: payload.data.matchId,
              team1Score: parsedData?.team1?.stats?.score,
              team2Score: parsedData?.team2?.stats?.score,
            },
          });
          window.dispatchEvent(roundEndEvent);

          // Also dispatch player update events for each player
          if (parsedData?.players) {
            console.log(
              "Dispatching player update events for round completion"
            );
            for (const player of parsedData.players) {
              if (player.steam_id_64 && player.stats) {
                const playerUpdateEvent = new CustomEvent("player-update", {
                  detail: {
                    matchId: payload.data.matchId,
                    steamId: player.steam_id_64,
                    stats: {
                      kills: player.stats.kills || 0,
                      deaths: player.stats.deaths || 0,
                      assists: player.stats.assists || 0,
                      headshotKills: player.stats.kills_with_headshot || 0,
                      mvps: player.stats.mvps || 0,
                      score: player.stats.score || 0,
                      damage: player.stats.damage_dealt || 0,
                      doubleKills: player.stats["2ks"] || 0,
                      tripleKills: player.stats["3ks"] || 0,
                      quadraKills: player.stats["4ks"] || 0,
                      pentaKills: player.stats["5ks"] || 0,
                      killsWithPistol: player.stats.kills_with_pistol || 0,
                      killsWithSniper: player.stats.kills_with_sniper || 0,
                      entryAttempts: player.stats.entry_attempts || 0,
                      entrySuccesses: player.stats.entry_successes || 0,
                      flashesThrown: player.stats.flashes_thrown || 0,
                      flashesSuccessful: player.stats.flashes_successful || 0,
                      flashesEnemiesBlinded:
                        player.stats.flashes_enemies_blinded || 0,
                      utilityThrown: player.stats.utility_thrown || 0,
                      utilityDamage: player.stats.utility_damage || 0,
                      oneVsXAttempts: player.stats["1vX_attempts"] || 0,
                      oneVsXWins: player.stats["1vX_wins"] || 0,
                    },
                  },
                });
                window.dispatchEvent(playerUpdateEvent);
              }
            }
          }
        } else if (
          payload.data?.type === "match_completed" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground match completed notification received, updating live match"
          );
          console.log("Match completion data:", payload.data);

          // Parse the data properly
          let parsedData;
          try {
            parsedData =
              typeof payload.data.data === "string"
                ? JSON.parse(payload.data.data)
                : payload.data.data;
          } catch (error) {
            console.error("Failed to parse payload data:", error);
            parsedData = null;
          }

          // Dispatch a custom event for match end
          const matchEndEvent = new CustomEvent("match-end", {
            detail: {
              matchId: payload.data.matchId,
              winner: payload.data.winner,
              finalTeam1Score: parsedData?.team1?.stats?.score,
              finalTeam2Score: parsedData?.team2?.stats?.score,
            },
          });
          window.dispatchEvent(matchEndEvent);

          // Also dispatch player update events for each player
          if (parsedData?.players) {
            console.log(
              "Dispatching player update events for match completion"
            );
            for (const player of parsedData.players) {
              if (player.steam_id_64 && player.stats) {
                const playerUpdateEvent = new CustomEvent("player-update", {
                  detail: {
                    matchId: payload.data.matchId,
                    steamId: player.steam_id_64,
                    stats: {
                      kills: player.stats.kills || 0,
                      deaths: player.stats.deaths || 0,
                      assists: player.stats.assists || 0,
                      headshotKills: player.stats.kills_with_headshot || 0,
                      mvps: player.stats.mvps || 0,
                      score: player.stats.score || 0,
                      damage: player.stats.damage_dealt || 0,
                      doubleKills: player.stats["2ks"] || 0,
                      tripleKills: player.stats["3ks"] || 0,
                      quadraKills: player.stats["4ks"] || 0,
                      pentaKills: player.stats["5ks"] || 0,
                      killsWithPistol: player.stats.kills_with_pistol || 0,
                      killsWithSniper: player.stats.kills_with_sniper || 0,
                      entryAttempts: player.stats.entry_attempts || 0,
                      entrySuccesses: player.stats.entry_successes || 0,
                      flashesThrown: player.stats.flashes_thrown || 0,
                      flashesSuccessful: player.stats.flashes_successful || 0,
                      flashesEnemiesBlinded:
                        player.stats.flashes_enemies_blinded || 0,
                      utilityThrown: player.stats.utility_thrown || 0,
                      utilityDamage: player.stats.utility_damage || 0,
                      oneVsXAttempts: player.stats["1vX_attempts"] || 0,
                      oneVsXWins: player.stats["1vX_wins"] || 0,
                    },
                  },
                });
                window.dispatchEvent(playerUpdateEvent);
              }
            }
          }
        } else if (
          payload.data?.type === "player_update" &&
          payload.data?.matchId
        ) {
          console.log(
            "Foreground player update notification received, updating live match"
          );

          // Dispatch a custom event for player update
          const event = new CustomEvent("player-update", {
            detail: {
              matchId: payload.data.matchId,
              steamId: payload.data.steamId,
              stats: payload.data.stats,
            },
          });
          window.dispatchEvent(event);
        } else {
          console.log(
            "Foreground message received but not a recognized notification type"
          );
        }
      });

      return true;
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
      return false;
    }
  }

  async subscribeToPush(authToken: string): Promise<string | null> {
    console.log("Subscribing to push notifications...");
    console.log("Auth token available:", !!authToken);

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

        // Get device ID and platform
        const deviceId = getDeviceId();
        const platform = this.detectPlatform();

        console.log("Device ID:", deviceId);
        console.log("Platform:", platform);
        console.log("Sending push token to backend:", {
          token,
          deviceId,
          platform,
        });

        try {
          await setPushToken(token, deviceId, platform, authToken);
          console.log("Push token registered successfully:", {
            token,
            deviceId,
            platform,
          });
          return token;
        } catch (apiError) {
          console.error("Failed to send push token to backend:", apiError);
          console.error("API Error details:", {
            name: apiError.name,
            message: apiError.message,
            response: apiError.response?.data,
            status: apiError.response?.status,
          });
          // Still return the token even if backend registration fails
          return token;
        }
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
