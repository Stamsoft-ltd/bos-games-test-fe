import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMe } from "./api/auth";
import {
  acceptMatchFromNotification,
  declineMatchFromNotification,
} from "./api/user";
import { PushNotificationService } from "./utils/push-notifications";
import NotificationBadge from "./components/NotificationBadge";
import MatchAcceptanceModal from "./components/MatchAcceptanceModal";
import ServerConnectionModal from "./components/ServerConnectionModal";
import { BackgroundMessageTest } from "./utils/background-message-test";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import Teams from "./pages/Teams";
import Parties from "./pages/Parties";
import Notifications from "./pages/Notifications";
import SocialAuth from "./pages/SocialAuth";

export default function App() {
  const token = sessionStorage.getItem("token");
  const isAuthenticated = !!token;
  const [userNickname, setUserNickname] = useState<string>("");
  const [matchAcceptance, setMatchAcceptance] = useState<{
    matchId: string;
    isVisible: boolean;
    timeRemaining: number;
  } | null>(null);

  const [serverConnection, setServerConnection] = useState<{
    matchId: string;
    serverIp: string;
    serverPort: number;
    isVisible: boolean;
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
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            setUserNickname("");
          });
      } else {
        setUserNickname("");
      }
    } else {
      setUserNickname("");
    }
  }, [isAuthenticated]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
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
    }
  }, [isAuthenticated, token]);

  // Test function to check service worker status
  const testServiceWorker = async () => {
    if (!token) {
      console.warn("No auth token available");
      return;
    }

    const pushService = PushNotificationService.getInstance();
    const isWorking = await pushService.testServiceWorker();
    console.log("Service worker test result:", isWorking);

    if ("Notification" in window) {
      console.log("Notification permission:", Notification.permission);
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log("Service worker registrations:", registrations);
    }
  };

  // Test function to simulate background message modal triggering
  const testBackgroundMessageModal = async () => {
    console.log("Testing message modal triggering...");

    // Test foreground message handling first
    await BackgroundMessageTest.testForegroundMessage();

    // Wait a moment, then test background message handling
    setTimeout(async () => {
      await BackgroundMessageTest.testBasicModalTriggering();
    }, 2000);

    // Wait a moment, then test match started notification
    setTimeout(async () => {
      await BackgroundMessageTest.testMatchStartedNotification();
    }, 4000);
  };

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
        } else if (event.data.type === "MATCH_FOUND" && event.data.matchId) {
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
        } else if (event.data.type === "MATCH_STARTED" && event.data.matchId) {
          console.log(
            "Match started, showing server connection modal:",
            event.data.matchId
          );
          // Show server connection modal
          setServerConnection({
            matchId: event.data.matchId,
            serverIp: event.data.serverIp,
            serverPort: event.data.serverPort,
            isVisible: true,
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
            "Showing server connection modal for foreground match started message:",
            event.detail.matchId
          );
          setServerConnection({
            matchId: event.detail.matchId,
            serverIp: event.detail.serverIp,
            serverPort: event.detail.serverPort,
            isVisible: true,
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

          messageChannel.port1.onmessage = (event) => {
            console.log("Received response from service worker:", event.data);
            if (event.data && event.data.type === "MATCH_FOUND") {
              console.log(
                "Found pending match data, showing modal:",
                event.data
              );
              setMatchAcceptance({
                matchId: event.data.matchId,
                isVisible: true,
                timeRemaining: 30,
              });
            } else if (event.data && event.data.type === "MATCH_STARTED") {
              console.log(
                "Found pending match started data, showing server connection modal:",
                event.data
              );
              setServerConnection({
                matchId: event.data.matchId,
                serverIp: event.data.serverIp,
                serverPort: event.data.serverPort,
                isVisible: true,
              });
            } else {
              console.log(
                "No pending match data found or invalid data:",
                event.data
              );
            }
          };

          // Send message to service worker to check for pending match data
          console.log(
            "Sending CHECK_PENDING_MATCH message to active service worker"
          );
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
    setServerConnection(null);
  };

  const handleCopyConnectionInfo = () => {
    console.log("Connection info copied to clipboard");
    // You could show a toast notification here
  };

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
              <Link
                to="/notifications"
                className="text-indigo-500 hover:underline relative"
              >
                Notifications
                <NotificationBadge className="absolute -top-1 -right-1" />
              </Link>
              <button
                onClick={testServiceWorker}
                className="text-indigo-500 hover:underline text-sm"
                title="Test Service Worker"
              >
                🔧 Test SW
              </button>
              <button
                onClick={testBackgroundMessageModal}
                className="text-indigo-500 hover:underline text-sm"
                title="Test Background Message Modal"
              >
                🎯 Test BG Modal
              </button>
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
          <Route path="/notifications" element={<Notifications />} />
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
          onClose={handleServerConnectionClose}
          onCopyConnectionInfo={handleCopyConnectionInfo}
        />
      )}
    </div>
  );
}
