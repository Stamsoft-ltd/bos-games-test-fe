import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getMe } from "./api/auth";
import {
  acceptMatchFromNotification,
  declineMatchFromNotification,
} from "./api/user";
import { PushNotificationService } from "./utils/push-notifications";
import NotificationBadge from "./components/NotificationBadge";
import MatchAcceptanceModal from "./components/MatchAcceptanceModal";
import ServerConnectionModal from "./components/ServerConnectionModal";
import MapBanningModal from "./components/MapBanningModal";
import { DeviceIdDisplay } from "./components/DeviceIdDisplay";
import { BackgroundMessageTest } from "./utils/background-message-test";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import Teams from "./pages/Teams";
import Parties from "./pages/Parties";
import Notifications from "./pages/Notifications";
import SocialAuth from "./pages/SocialAuth";
import HardwareProfile from "./pages/HardwareProfile";
import LiveMatchPage from "./pages/LiveMatch";
import LiveMatches from "./pages/LiveMatches";
import {
  MapBanSession,
  getMapBanSession,
  handleBanTimeout,
} from "./api/map-banning";

export default function App() {
  const token = sessionStorage.getItem("token");
  const isAuthenticated = !!token;
  const [userNickname, setUserNickname] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [matchAcceptance, setMatchAcceptance] = useState<{
    matchId: string;
    isVisible: boolean;
    timeRemaining: number;
  } | null>(null);

  const [serverConnection, setServerConnection] = useState<{
    matchId: string;
    serverIp?: string;
    serverPort?: number;
    selectedMap?: string;
    isVisible: boolean;
    isLoadingConnectionDetails?: boolean;
  } | null>(null);

  const [mapBanning, setMapBanning] = useState<{
    matchId: string;
    session: MapBanSession | null;
    isVisible: boolean;
  } | null>(null);

  // Ref to track current server connection modal state
  const serverConnectionRef = useRef<{
    matchId: string;
    serverIp?: string;
    serverPort?: number;
    selectedMap?: string;
    isVisible: boolean;
    isLoadingConnectionDetails?: boolean;
  } | null>(null);

  // Get user nickname from API
  useEffect(() => {
    if (isAuthenticated) {
      const token = sessionStorage.getItem("token");
      if (token) {
        getMe(token)
          .then((user) => {
            console.log("user", user);
            setUserNickname(user.nickname || "");
            setUserId(user.id || "");
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            setUserNickname("");
          });
      } else {
        setUserNickname("");
        setUserId("");
      }
    } else {
      setUserNickname("");
      setUserId("");
    }
  }, [isAuthenticated]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    console.log("Push notification initialization check:", {
      isAuthenticated,
      hasToken: !!token,
    });

    if (isAuthenticated && token) {
      console.log("Starting push notification initialization...");
      const pushService = PushNotificationService.getInstance();
      pushService
        .initialize(token)
        .then((success) => {
          if (success) {
            console.log("Push notifications initialized successfully");
          } else {
            console.log(
              "Push notifications not available or permission denied"
            );
          }
        })
        .catch((error) => {
          console.error("Error initializing push notifications:", error);
        });
    } else {
      console.log(
        "Skipping push notification initialization - not authenticated or no token"
      );
    }
  }, [isAuthenticated, token]);

  // Handle service worker messages for match acceptance
  useEffect(() => {
    const handleServiceWorkerMessage = async (event: MessageEvent) => {
      console.log("Service worker message received:", event.data);

      if (!token) {
        console.warn("No auth token available for match action");
        return;
      }

      try {
        // Handle different message types from service worker
        if (event.data.type === "MATCH_ACCEPT" && event.data.matchId) {
          console.log("Accepting match from notification:", event.data.matchId);
          const result = await acceptMatchFromNotification(
            token,
            event.data.matchId
          );
          console.log("Match accepted:", result);

          // Show success notification
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Match Accepted!", {
              body: "You have accepted the match. Get ready to play!",
              icon: "/favicon.ico",
            });
          }
        } else if (event.data.type === "MATCH_DECLINE" && event.data.matchId) {
          console.log("Declining match from notification:", event.data.matchId);
          const result = await declineMatchFromNotification(
            token,
            event.data.matchId
          );
          console.log("Match declined:", result);

          // Show decline notification
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Match Declined", {
              body: "You have declined the match. You can rejoin the queue anytime.",
              icon: "/favicon.ico",
            });
          }
        } else if (event.data.type === "match_found" && event.data.matchId) {
          console.log(
            "Match found, showing acceptance modal:",
            event.data.matchId
          );
          // Show match acceptance modal with 30 second countdown
          setMatchAcceptance({
            matchId: event.data.matchId,
            isVisible: true,
            timeRemaining: 30,
          });
        } else if (event.data.type === "match_started" && event.data.matchId) {
          console.log(
            "Match started, updating server connection modal:",
            event.data.matchId
          );
          console.log("Current server connection state:", serverConnection);
          console.log(
            "Current server connection ref:",
            serverConnectionRef.current
          );

          // Check if we already have a modal for this match using ref for reliability
          const existingModal =
            serverConnectionRef.current &&
            serverConnectionRef.current.matchId === event.data.matchId;
          console.log("Existing modal found:", existingModal);

          if (existingModal) {
            // Update existing modal with connection details
            console.log(
              "✅ UPDATING existing server connection modal with details"
            );
            const updatedModal = {
              matchId: serverConnectionRef.current!.matchId,
              serverIp: event.data.serverIp,
              serverPort: event.data.serverPort,
              selectedMap: serverConnectionRef.current!.selectedMap,
              isLoadingConnectionDetails: false,
              isVisible: true, // Ensure it stays visible
            };
            console.log("Updated modal state:", updatedModal);
            setServerConnection(updatedModal);
          } else {
            // Create new modal if none exists
            console.log("🆕 CREATING new server connection modal");
            const newModal = {
              matchId: event.data.matchId,
              serverIp: event.data.serverIp,
              serverPort: event.data.serverPort,
              selectedMap: event.data.selectedMap,
              isVisible: true,
              isLoadingConnectionDetails: false,
            };
            console.log("New modal state:", newModal);
            setServerConnection(newModal);
          }

          // Set 60-second timeout to redirect to live match page
          setTimeout(() => {
            console.log(
              "60-second timeout reached, redirecting to live match page"
            );
            window.location.href = `/live-match/${event.data.matchId}`;
          }, 60000); // 60 seconds
        } else if (
          event.data.type === "map_banning_started" &&
          event.data.matchId
        ) {
          console.log(
            "Map banning started, showing map banning modal:",
            event.data.matchId
          );
          console.log("Map banning event data:", event.data);
          // Show map banning modal
          setMapBanning({
            matchId: event.data.matchId,
            session: null, // Will be fetched via polling
            isVisible: true,
          });
        } else if (
          event.data.type === "round_completed" &&
          event.data.matchId
        ) {
          console.log(
            "App: Round completed, dispatching round-end event:",
            event.data.matchId
          );
          console.log("App: Round completion data:", event.data);
          // Dispatch round-end event for live match updates
          const roundEndEvent = new CustomEvent("round-end", {
            detail: {
              matchId: event.data.matchId,
              team1Score: event.data.team1Score,
              team2Score: event.data.team2Score,
            },
          });
          console.log(
            "App: Dispatching round-end event from service worker:",
            roundEndEvent.detail
          );
          window.dispatchEvent(roundEndEvent);
        } else if (
          event.data.type === "match_completed" &&
          event.data.matchId
        ) {
          console.log(
            "App: Match completed, dispatching match-end event:",
            event.data.matchId
          );
          console.log("App: Match completion data:", event.data);
          // Dispatch match-end event for live match updates
          const matchEndEvent = new CustomEvent("match-end", {
            detail: {
              matchId: event.data.matchId,
              winner: event.data.winner,
              finalTeam1Score: event.data.finalTeam1Score,
              finalTeam2Score: event.data.finalTeam2Score,
            },
          });
          console.log(
            "App: Dispatching match-end event from service worker:",
            matchEndEvent.detail
          );
          window.dispatchEvent(matchEndEvent);
        } else if (event.data.type === "player_update" && event.data.matchId) {
          console.log(
            "App: Player update, dispatching player-update event:",
            event.data.matchId
          );
          console.log("App: Player update data:", event.data);
          // Dispatch player-update event for live match updates
          const playerUpdateEvent = new CustomEvent("player-update", {
            detail: {
              matchId: event.data.matchId,
              steamId: event.data.steamId,
              stats: event.data.stats,
            },
          });
          console.log(
            "App: Dispatching player-update event from service worker:",
            playerUpdateEvent.detail
          );
          window.dispatchEvent(playerUpdateEvent);
        } else if (event.data.type === "map_banned" && event.data.matchId) {
          console.log(
            "Map banned, updating map banning modal:",
            event.data.matchId
          );
          console.log("Map banned event data:", event.data);

          // Fetch the updated session from backend to get the complete state
          if (token) {
            console.log(
              "Fetching updated session for match:",
              event.data.matchId
            );

            // Add retry logic for session fetching
            const fetchSessionWithRetry = async (retries = 3, delay = 1000) => {
              for (let i = 0; i < retries; i++) {
                try {
                  const updatedSession = await getMapBanSession(
                    event.data.matchId,
                    token
                  );
                  console.log(
                    "Fetched updated session after map ban:",
                    updatedSession
                  );
                  console.log("Updated session details:", {
                    currentLeaderIndex: updatedSession?.currentLeaderIndex,
                    leaderIds: updatedSession?.leaderIds,
                    currentLeader:
                      updatedSession?.leaderIds?.[
                        updatedSession?.currentLeaderIndex
                      ],
                    availableMaps: updatedSession?.availableMaps,
                    bannedMaps: updatedSession?.bannedMaps,
                    isComplete: updatedSession?.isComplete,
                  });

                  setMapBanning((prev) => {
                    if (prev && prev.matchId === event.data.matchId) {
                      console.log(
                        "Updating map banning modal with new session"
                      );
                      return {
                        ...prev,
                        session: updatedSession,
                      };
                    }
                    console.log(
                      "No matching map banning modal found for match:",
                      event.data.matchId
                    );
                    return prev;
                  });
                  return; // Success, exit retry loop
                } catch (error) {
                  console.error(
                    `Error fetching updated session after map ban (attempt ${
                      i + 1
                    }/${retries}):`,
                    error
                  );
                  if (i < retries - 1) {
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                  }
                }
              }

              // If all retries failed, use fallback logic
              console.log("All retries failed, using fallback logic");
              setMapBanning((prev) => {
                if (
                  prev &&
                  prev.matchId === event.data.matchId &&
                  prev.session
                ) {
                  // Parse remainingMaps from JSON string to array
                  let remainingMapsArray: string[] = [];
                  try {
                    remainingMapsArray = JSON.parse(event.data.remainingMaps);
                  } catch (error) {
                    console.error("Error parsing remainingMaps:", error);
                    remainingMapsArray = [];
                  }

                  const updatedSession = {
                    ...prev.session,
                    availableMaps: remainingMapsArray,
                    currentLeaderIndex: event.data.currentLeaderIndex || 0,
                    bannedMaps: prev.session.bannedMaps?.includes(
                      event.data.bannedMap
                    )
                      ? prev.session.bannedMaps
                      : [
                          ...(prev.session.bannedMaps || []),
                          event.data.bannedMap,
                        ],
                  };

                  console.log("Using fallback session update:", updatedSession);
                  return {
                    ...prev,
                    session: updatedSession,
                  };
                }
                return prev;
              });
            };

            // Execute the retry logic
            fetchSessionWithRetry();
          }
        } else if (
          event.data.type === "MAP_BANNING_COMPLETE" &&
          event.data.matchId
        ) {
          console.log(
            "Map banning complete, showing server connection modal:",
            event.data.matchId
          );
          console.log("Map banning complete event data:", event.data);

          // Clear any stored map banning data from service worker
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "CLEAR_MAP_BANNING_DATA",
              matchId: event.data.matchId,
            });
          }

          // Close map banning modal
          setMapBanning(null);

          // Show server connection modal with selected map and loading state for all users
          setServerConnection({
            matchId: event.data.matchId,
            selectedMap: event.data.selectedMap,
            isVisible: true,
            isLoadingConnectionDetails: true,
          });
        }
      } catch (error) {
        console.error("Error handling match action:", error);

        // Show error notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Error", {
            body: "Failed to process match action. Please try again.",
            icon: "/favicon.ico",
          });
        }
      }
    };

    // Handle foreground messages from Firebase
    const handleForegroundMatch = (event: CustomEvent) => {
      console.log("Foreground match event received:", event.detail);

      if (event.detail && event.detail.matchId) {
        if (event.detail.type === "MATCH_STARTED") {
          console.log(
            "Updating server connection modal for foreground match started message:",
            event.detail.matchId
          );
          console.log(
            "Current server connection state (foreground):",
            serverConnection
          );

          // Check if we already have a modal for this match
          const existingModal =
            serverConnection &&
            serverConnection.matchId === event.detail.matchId;
          console.log("Existing modal found (foreground):", existingModal);

          if (existingModal) {
            // Update existing modal with connection details
            console.log(
              "✅ UPDATING existing server connection modal with details (foreground)"
            );
            setServerConnection({
              ...serverConnection,
              serverIp: event.detail.serverIp,
              serverPort: event.detail.serverPort,
              isLoadingConnectionDetails: false,
              isVisible: true, // Ensure it stays visible
            });
          } else {
            // Create new modal if none exists
            console.log("🆕 CREATING new server connection modal (foreground)");
            setServerConnection({
              matchId: event.detail.matchId,
              serverIp: event.detail.serverIp,
              serverPort: event.detail.serverPort,
              selectedMap: event.detail.selectedMap,
              isVisible: true,
              isLoadingConnectionDetails: false,
            });
          }

          // Set 60-second timeout to redirect to live match page
          setTimeout(() => {
            console.log(
              "60-second timeout reached, redirecting to live match page"
            );
            window.location.href = `/live-match/${event.detail.matchId}`;
          }, 60000); // 60 seconds
        } else if (event.detail.type === "MAP_BANNING_STARTED") {
          console.log(
            "Showing map banning modal for foreground map banning message:",
            event.detail.matchId
          );
          // Fetch initial session data
          if (token) {
            getMapBanSession(event.detail.matchId, token)
              .then((session) => {
                setMapBanning({
                  matchId: event.detail.matchId,
                  session: session,
                  isVisible: true,
                });
              })
              .catch((error) => {
                console.error(
                  "Error fetching initial map banning session:",
                  error
                );
                setMapBanning({
                  matchId: event.detail.matchId,
                  session: null,
                  isVisible: true,
                });
              });
          } else {
            setMapBanning({
              matchId: event.detail.matchId,
              session: null,
              isVisible: true,
            });
          }
        } else if (event.detail.type === "MAP_BANNED") {
          console.log(
            "Updating map banning modal for foreground map banned message:",
            event.detail.matchId
          );

          // Fetch the updated session from backend to get the complete state
          if (token) {
            console.log(
              "Fetching updated session for match (foreground):",
              event.detail.matchId
            );

            // Add retry logic for session fetching (same as background)
            const fetchSessionWithRetry = async (retries = 3, delay = 1000) => {
              for (let i = 0; i < retries; i++) {
                try {
                  const updatedSession = await getMapBanSession(
                    event.detail.matchId,
                    token
                  );
                  console.log(
                    "Fetched updated session after map ban (foreground):",
                    updatedSession
                  );
                  console.log("Updated session details (foreground):", {
                    currentLeaderIndex: updatedSession?.currentLeaderIndex,
                    leaderIds: updatedSession?.leaderIds,
                    currentLeader:
                      updatedSession?.leaderIds?.[
                        updatedSession?.currentLeaderIndex
                      ],
                    availableMaps: updatedSession?.availableMaps,
                    bannedMaps: updatedSession?.bannedMaps,
                    isComplete: updatedSession?.isComplete,
                  });

                  setMapBanning((prev) => {
                    if (prev && prev.matchId === event.detail.matchId) {
                      console.log(
                        "Updating map banning modal with new session (foreground)"
                      );
                      return {
                        ...prev,
                        session: updatedSession,
                      };
                    }
                    console.log(
                      "No matching map banning modal found for match (foreground):",
                      event.detail.matchId
                    );
                    return prev;
                  });
                  return; // Success, exit retry loop
                } catch (error) {
                  console.error(
                    `Error fetching updated session after map ban (foreground, attempt ${
                      i + 1
                    }/${retries}):`,
                    error
                  );
                  if (i < retries - 1) {
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                  }
                }
              }

              // If all retries failed, use fallback logic
              console.log(
                "All retries failed, using fallback logic (foreground)"
              );
              setMapBanning((prev) => {
                if (
                  prev &&
                  prev.matchId === event.detail.matchId &&
                  prev.session
                ) {
                  // Parse remainingMaps from JSON string to array
                  let remainingMapsArray: string[] = [];
                  try {
                    remainingMapsArray = JSON.parse(event.detail.remainingMaps);
                  } catch (error) {
                    console.error("Error parsing remainingMaps:", error);
                    remainingMapsArray = [];
                  }

                  const updatedSession = {
                    ...prev.session,
                    availableMaps: remainingMapsArray,
                    currentLeaderIndex: event.detail.currentLeaderIndex || 0,
                    bannedMaps: prev.session.bannedMaps?.includes(
                      event.detail.bannedMap
                    )
                      ? prev.session.bannedMaps
                      : [
                          ...(prev.session.bannedMaps || []),
                          event.detail.bannedMap,
                        ],
                  };

                  console.log(
                    "Using fallback session update (foreground):",
                    updatedSession
                  );
                  return {
                    ...prev,
                    session: updatedSession,
                  };
                }
                return prev;
              });
            };

            // Execute the retry logic
            fetchSessionWithRetry();
          }
        } else if (event.detail.type === "MAP_BANNING_COMPLETE") {
          console.log(
            "Closing map banning modal for foreground map banning complete message:",
            event.detail.matchId
          );

          // Clear any stored map banning data from service worker
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "CLEAR_MAP_BANNING_DATA",
              matchId: event.detail.matchId,
            });
          }

          // Close map banning modal
          setMapBanning(null);

          // Show server connection modal with selected map and loading state for all users
          setServerConnection({
            matchId: event.detail.matchId,
            selectedMap: event.detail.selectedMap,
            isVisible: true,
            isLoadingConnectionDetails: true,
          });
        } else {
          console.log(
            "Showing match acceptance modal for foreground message:",
            event.detail.matchId
          );
          setMatchAcceptance({
            matchId: event.detail.matchId,
            isVisible: true,
            timeRemaining: 30,
          });
        }
      }
    };

    // Ensure service worker is registered
    const ensureServiceWorkerRegistered = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
          console.log("Service worker registered:", registration);

          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;
          console.log("Service worker ready");

          // Force the service worker to activate if it's not already
          if (registration.waiting) {
            console.log("Service worker waiting, sending skipWaiting message");
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }

          // Check if we have a controller or active service worker
          if (navigator.serviceWorker.controller) {
            console.log("Service worker controller available");
          } else if (registration.active) {
            console.log("Service worker active but not controlling");
          } else {
            console.log("No service worker controller or active registration");
          }
        } catch (error) {
          console.error("Service worker registration failed:", error);
        }
      }
    };

    // Register service worker and set up listeners
    ensureServiceWorkerRegistered().then(() => {
      // Listen for messages from service worker
      navigator.serviceWorker?.addEventListener(
        "message",
        handleServiceWorkerMessage
      );

      // Listen for foreground match events
      window.addEventListener(
        "matchFound",
        handleForegroundMatch as EventListener
      );
    });

    // Check for pending match data when app becomes active
    const checkPendingMatchData = async () => {
      // Wait for service worker to be available
      if (!navigator.serviceWorker) {
        console.log("Service worker not supported");
        return;
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Try to get the service worker registration and communicate directly
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          console.log("Found active service worker, communicating directly");

          // Create a message channel to communicate with service worker
          const messageChannel = new MessageChannel();

          // Add timeout to prevent waiting indefinitely
          const timeout = setTimeout(() => {
            console.log("Timeout waiting for service worker response");
            messageChannel.port1.close();
          }, 5000); // 5 second timeout

          messageChannel.port1.onmessage = async (event) => {
            clearTimeout(timeout);
            console.log("Received response from service worker:", event.data);
            console.log("Response data type:", typeof event.data);
            console.log(
              "Response data structure:",
              JSON.stringify(event.data, null, 2)
            );

            if (event.data && event.data.type === "match_found") {
              console.log(
                "Found pending match data, showing modal:",
                event.data
              );
              setMatchAcceptance({
                matchId: event.data.matchId,
                isVisible: true,
                timeRemaining: 30,
              });
            } else if (event.data && event.data.type === "match_started") {
              console.log(
                "Found pending match started data, updating server connection modal:",
                event.data
              );
              console.log(
                "Current server connection state (pending):",
                serverConnection
              );

              // Check if we already have a modal for this match
              const existingModal =
                serverConnection &&
                serverConnection.matchId === event.data.matchId;
              console.log("Existing modal found (pending):", existingModal);

              if (existingModal) {
                // Update existing modal with connection details
                console.log(
                  "✅ UPDATING existing server connection modal with pending details"
                );
                setServerConnection({
                  ...serverConnection,
                  serverIp: event.data.serverIp,
                  serverPort: event.data.serverPort,
                  isLoadingConnectionDetails: false,
                  isVisible: true, // Ensure it stays visible
                });
              } else {
                // Create new modal if none exists
                console.log(
                  "🆕 CREATING new server connection modal with pending details"
                );
                setServerConnection({
                  matchId: event.data.matchId,
                  serverIp: event.data.serverIp,
                  serverPort: event.data.serverPort,
                  selectedMap: event.data.selectedMap,
                  isVisible: true,
                  isLoadingConnectionDetails: false,
                });
              }
            } else if (
              event.data &&
              event.data.type === "map_banning_started"
            ) {
              console.log(
                "Found pending map banning data, showing map banning modal:",
                event.data
              );
              // Fetch the initial session data
              if (token) {
                try {
                  const session = await getMapBanSession(
                    event.data.matchId,
                    token
                  );
                  console.log("Fetched map banning session:", session);
                  console.log("Current user ID:", userId);
                  console.log("Session leader IDs:", session?.leaderIds);
                  console.log(
                    "Current leader index:",
                    session?.currentLeaderIndex
                  );
                  console.log(
                    "Is current user's turn:",
                    session?.leaderIds[session?.currentLeaderIndex || 0] ===
                      userId
                  );
                  setMapBanning({
                    matchId: event.data.matchId,
                    session: session,
                    isVisible: true,
                  });
                } catch (error) {
                  console.error("Error fetching map banning session:", error);
                  // Still show modal even if session fetch fails
                  setMapBanning({
                    matchId: event.data.matchId,
                    session: null,
                    isVisible: true,
                  });
                }
              } else {
                console.log(
                  "No token available for fetching map banning session"
                );
                setMapBanning({
                  matchId: event.data.matchId,
                  session: null,
                  isVisible: true,
                });
              }
            } else if (event.data && event.data.type === "map_banned") {
              console.log(
                "Found pending map banned data, updating map banning modal:",
                event.data
              );
              // Fetch the updated session data
              if (token) {
                try {
                  const session = await getMapBanSession(
                    event.data.matchId,
                    token
                  );
                  console.log(
                    "Fetched updated session after map ban:",
                    session
                  );
                  setMapBanning((prev) => {
                    if (prev && prev.matchId === event.data.matchId) {
                      return {
                        ...prev,
                        session: session,
                      };
                    }
                    return prev;
                  });
                } catch (error) {
                  console.error(
                    "Error fetching updated session after map ban:",
                    error
                  );
                }
              }
            } else if (
              event.data &&
              event.data.type === "map_banning_complete"
            ) {
              console.log(
                "Found pending map banning complete data, showing server connection modal:",
                event.data
              );

              // Close map banning modal if it's open
              setMapBanning(null);

              // Show server connection modal with selected map and loading state for all users
              setServerConnection({
                matchId: event.data.matchId,
                selectedMap: event.data.selectedMap,
                isVisible: true,
                isLoadingConnectionDetails: true,
              });
            } else if (event.data && event.data.type === "round_completed") {
              console.log(
                "App: Found pending round completed data, dispatching round-end event:",
                event.data
              );
              // Dispatch round-end event for live match updates
              const roundEndEvent = new CustomEvent("round-end", {
                detail: {
                  matchId: event.data.matchId,
                  team1Score: event.data.team1Score,
                  team2Score: event.data.team2Score,
                },
              });
              console.log(
                "App: Dispatching round-end event:",
                roundEndEvent.detail
              );
              window.dispatchEvent(roundEndEvent);

              // Also dispatch player update events for each player
              if (event.data.players && Array.isArray(event.data.players)) {
                console.log(
                  "App: Dispatching player update events for round completion"
                );
                for (const player of event.data.players) {
                  if (player.steam_id_64 && player.stats) {
                    const playerUpdateEvent = new CustomEvent("player-update", {
                      detail: {
                        matchId: event.data.matchId,
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
                          flashesSuccessful:
                            player.stats.flashes_successful || 0,
                          flashesEnemiesBlinded:
                            player.stats.flashes_enemies_blinded || 0,
                          utilityThrown: player.stats.utility_thrown || 0,
                          utilityDamage: player.stats.utility_damage || 0,
                          oneVsXAttempts: player.stats["1vX_attempts"] || 0,
                          oneVsXWins: player.stats["1vX_wins"] || 0,
                        },
                      },
                    });
                    console.log(
                      "App: Dispatching player-update event for round completion:",
                      playerUpdateEvent.detail
                    );
                    window.dispatchEvent(playerUpdateEvent);
                  }
                }
              }
            } else if (event.data && event.data.type === "match_completed") {
              console.log(
                "App: Found pending match completed data, dispatching match-end event:",
                event.data
              );
              // Dispatch match-end event for live match updates
              const matchEndEvent = new CustomEvent("match-end", {
                detail: {
                  matchId: event.data.matchId,
                  winner: event.data.winner,
                  finalTeam1Score: event.data.finalTeam1Score,
                  finalTeam2Score: event.data.finalTeam2Score,
                },
              });
              console.log(
                "App: Dispatching match-end event:",
                matchEndEvent.detail
              );
              window.dispatchEvent(matchEndEvent);

              // Also dispatch player update events for each player
              if (event.data.players && Array.isArray(event.data.players)) {
                console.log(
                  "App: Dispatching player update events for match completion"
                );
                for (const player of event.data.players) {
                  if (player.steam_id_64 && player.stats) {
                    const playerUpdateEvent = new CustomEvent("player-update", {
                      detail: {
                        matchId: event.data.matchId,
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
                          flashesSuccessful:
                            player.stats.flashes_successful || 0,
                          flashesEnemiesBlinded:
                            player.stats.flashes_enemies_blinded || 0,
                          utilityThrown: player.stats.utility_thrown || 0,
                          utilityDamage: player.stats.utility_damage || 0,
                          oneVsXAttempts: player.stats["1vX_attempts"] || 0,
                          oneVsXWins: player.stats["1vX_wins"] || 0,
                        },
                      },
                    });
                    console.log(
                      "App: Dispatching player-update event for match completion:",
                      playerUpdateEvent.detail
                    );
                    window.dispatchEvent(playerUpdateEvent);
                  }
                }
              }
            } else if (event.data && event.data.type === "player_update") {
              console.log(
                "App: Found pending player update data, dispatching player-update event:",
                event.data
              );
              // Dispatch player-update event for live match updates
              const playerUpdateEvent = new CustomEvent("player-update", {
                detail: {
                  matchId: event.data.matchId,
                  steamId: event.data.steamId,
                  stats: event.data.stats,
                },
              });
              console.log(
                "App: Dispatching player-update event:",
                playerUpdateEvent.detail
              );
              window.dispatchEvent(playerUpdateEvent);
            } else {
              console.log(
                "No pending match data found or invalid data:",
                event.data
              );
              console.log(
                "Event data is null/undefined:",
                event.data === null || event.data === undefined
              );
            }
          };

          registration.active.postMessage({ type: "CHECK_PENDING_MATCH" }, [
            messageChannel.port2,
          ]);
          return;
        }
      } catch (error) {
        console.error("Error communicating with service worker:", error);
      }

      console.log("No active service worker registration found");
    };

    // Check for pending data when component mounts
    checkPendingMatchData();

    // Check for pending data when window becomes visible/focused
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("App became visible, checking for pending match data");
        checkPendingMatchData();
      }
    };

    const handleFocus = () => {
      console.log("App gained focus, checking for pending match data");
      checkPendingMatchData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage
      );
      window.removeEventListener(
        "matchFound",
        handleForegroundMatch as EventListener
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token]);

  // Debug useEffect to track server connection modal state changes
  useEffect(() => {
    console.log("🔄 Server connection modal state changed:", serverConnection);
    if (serverConnection) {
      console.log("📊 Modal details:", {
        matchId: serverConnection.matchId,
        serverIp: serverConnection.serverIp,
        serverPort: serverConnection.serverPort,
        selectedMap: serverConnection.selectedMap,
        isVisible: serverConnection.isVisible,
        isLoadingConnectionDetails: serverConnection.isLoadingConnectionDetails,
      });
      // Update ref with current state
      serverConnectionRef.current = serverConnection;
    } else {
      serverConnectionRef.current = null;
    }
  }, [serverConnection]);

  // Handle match acceptance modal actions
  const handleMatchAccept = async () => {
    if (!matchAcceptance || !token) return;

    try {
      console.log("Accepting match from modal:", matchAcceptance.matchId);
      const result = await acceptMatchFromNotification(
        token,
        matchAcceptance.matchId
      );
      console.log("Match accepted:", result);

      // Close modal
      setMatchAcceptance(null);

      // Show success notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Match Accepted!", {
          body: "You have accepted the match. Get ready to play!",
          icon: "/favicon.ico",
        });
      }
    } catch (error) {
      console.error("Error accepting match:", error);
      setMatchAcceptance(null);
    }
  };

  const handleMatchDecline = async () => {
    if (!matchAcceptance || !token) return;

    try {
      console.log("Declining match from modal:", matchAcceptance.matchId);
      const result = await declineMatchFromNotification(
        token,
        matchAcceptance.matchId
      );
      console.log("Match declined:", result);

      // Close modal
      setMatchAcceptance(null);

      // Show decline notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Match Declined", {
          body: "You have declined the match. You can rejoin the queue anytime.",
          icon: "/favicon.ico",
        });
      }
    } catch (error) {
      console.error("Error declining match:", error);
      setMatchAcceptance(null);
    }
  };

  const handleMatchTimeout = () => {
    console.log("Match acceptance timed out");
    setMatchAcceptance(null);
  };

  const handleServerConnectionClose = () => {
    console.log("Server connection modal closed");
    console.log("Closing modal with state:", serverConnection);
    setServerConnection(null);
  };

  const handleCopyConnectionInfo = () => {
    console.log("Connection info copied to clipboard");
    // You could show a toast notification here
  };

  const handleLaunchGame = () => {
    console.log("Launching CS2 game...");
    // You can add additional logging or analytics here
  };

  // Map banning handlers
  const handleMapBanningTimeout = async () => {
    if (!mapBanning || !token) return;

    try {
      console.log("Map banning timed out, handling timeout...");
      await handleBanTimeout(mapBanning.matchId, token);
      // The session will be updated via polling or websocket
    } catch (error) {
      console.error("Error handling map banning timeout:", error);
    }
  };

  const handleMapSelected = (selectedMap: string) => {
    console.log("Map selected:", selectedMap);
    // The session will be updated via polling or websocket
  };

  const handleMapBanningClose = () => {
    console.log("Map banning modal closed");
    setMapBanning(null);
  };

  // TESTING: Fully relying on push notifications for real-time updates
  // Removed polling mechanism to test if push notifications alone can handle all state synchronization
  // This will help determine if push notifications are reliable enough for production use

  // Real-time updates are handled via notifications instead of polling

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-4 py-2 flex justify-between items-center">
        <Link to="/" className="font-bold text-lg text-indigo-600">
          BOS Games Portal
          {userNickname && (
            <span className="text-sm text-gray-600 font-normal ml-2">
              • {userNickname}
            </span>
          )}
        </Link>
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              {userNickname && (
                <span className="text-sm text-gray-600 font-medium">
                  👤 {userNickname}
                </span>
              )}
              <Link to="/dashboard" className="text-indigo-500 hover:underline">
                Dashboard
              </Link>
              <Link to="/friends" className="text-indigo-500 hover:underline">
                Friends
              </Link>
              <Link to="/teams" className="text-indigo-500 hover:underline">
                Teams
              </Link>
              <Link to="/parties" className="text-indigo-500 hover:underline">
                Parties
              </Link>
              <Link to="/hardware" className="text-indigo-500 hover:underline">
                Hardware
              </Link>
              <Link
                to="/live-matches"
                className="text-indigo-500 hover:underline"
              >
                Live Matches
              </Link>
              <button
                onClick={() => {
                  // Multiple approaches to handle fullscreen game focus issues
                  const steamUrl = `steam://run/730//+connect 156.146.52.210:26952 -novid`;

                  console.log("Attempting to connect to test server:", {
                    steamUrl,
                  });

                  // Try multiple approaches to handle fullscreen game focus
                  const tryConnect = async () => {
                    try {
                      console.log("Attempt 1: Using steam://run command");
                      window.location.href = steamUrl;
                    } catch (error) {
                      console.log("Initial connection attempt failed:", error);
                    }
                  };

                  tryConnect();
                }}
                className="text-indigo-500 hover:underline"
              >
                🧪 Test Server
              </button>
              <Link
                to="/notifications"
                className="text-indigo-500 hover:underline relative"
              >
                Notifications
                <NotificationBadge className="absolute -top-1 -right-1" />
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="text-indigo-500 hover:underline">
                Register
              </Link>
              <Link to="/login" className="text-indigo-500 hover:underline">
                Login
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/social" element={<SocialAuth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/hardware" element={<HardwareProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/live-matches" element={<LiveMatches />} />
          <Route path="/live-match/:matchId" element={<LiveMatchPage />} />
        </Routes>
      </main>

      {/* Match Acceptance Modal */}
      {matchAcceptance && (
        <MatchAcceptanceModal
          isVisible={matchAcceptance.isVisible}
          timeRemaining={matchAcceptance.timeRemaining}
          onAccept={handleMatchAccept}
          onDecline={handleMatchDecline}
          onTimeout={handleMatchTimeout}
        />
      )}

      {/* Server Connection Modal */}
      {serverConnection && (
        <ServerConnectionModal
          isVisible={serverConnection.isVisible}
          serverIp={serverConnection.serverIp}
          serverPort={serverConnection.serverPort}
          matchId={serverConnection.matchId}
          selectedMap={serverConnection.selectedMap}
          isLoadingConnectionDetails={
            serverConnection.isLoadingConnectionDetails
          }
          onClose={handleServerConnectionClose}
          onCopyConnectionInfo={handleCopyConnectionInfo}
          onLaunchGame={handleLaunchGame}
        />
      )}

      {/* Map Banning Modal */}
      {mapBanning && (
        <MapBanningModal
          isVisible={mapBanning.isVisible}
          session={mapBanning.session}
          currentUserId={userId} // Using actual user ID
          token={token || ""}
          onMapSelected={handleMapSelected}
          onTimeout={handleMapBanningTimeout}
          onClose={handleMapBanningClose}
        />
      )}

      {/* Device ID Display for debugging */}
      <DeviceIdDisplay />
    </div>
  );
}
