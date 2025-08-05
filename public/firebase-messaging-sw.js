// Firebase messaging service worker - required by Firebase Cloud Messaging
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

// Persistent storage for service worker data
const SW_STORAGE_KEY = "bos-games-sw-data";

// Helper functions for persistent storage
const swStorage = {
  async get(key) {
    try {
      const result = await caches.open("sw-storage");
      const response = await result.match(key);
      if (response) {
        const data = await response.json();
        console.log("Data retrieved from storage:", key, data);
        return data;
      }
      console.log("No data found in storage for key:", key);
      return null;
    } catch (error) {
      console.log("Error reading from storage:", error);
      return null;
    }
  },

  async set(key, value) {
    try {
      const cache = await caches.open("sw-storage");
      const response = new Response(JSON.stringify(value));
      await cache.put(key, response);
      console.log("Data stored successfully:", key, value);
    } catch (error) {
      console.log("Error writing to storage:", error);
    }
  },

  async delete(key) {
    try {
      const cache = await caches.open("sw-storage");
      await cache.delete(key);
      console.log("Data deleted successfully:", key);
    } catch (error) {
      console.log("Error deleting from storage:", error);
    }
  },
};

// Firebase configuration - this should match your web app config
firebase.initializeApp({
  apiKey: "AIzaSyDUsEFOdlNO8muiTUx0Em65KY59Da_V_3A",
  authDomain: "bos-games-145f0.firebaseapp.com",
  projectId: "bos-games-145f0",
  storageBucket: "bos-games-145f0.firebasestorage.app",
  messagingSenderId: "303868662210",
  appId: "1:303868662210:web:8d737920e41afe8540065b",
  measurementId: "G-5NHMN87Z34",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(async (payload) => {
  console.log("Received background message:", payload);
  console.log("Payload data:", payload.data);
  console.log("Payload notification:", payload.notification);
  console.log("Action check:", payload.data?.action);
  console.log("MatchId check:", payload.data?.matchId);
  console.log("Full payload structure:", JSON.stringify(payload, null, 2));
  if (payload.data.data) {
    try {
      payload.data.data = JSON.parse(payload.data.data);
      console.log("Parsed data field:", payload.data.data);
    } catch (error) {
      console.log("Error parsing data field:", error);
    }
  }

  const notificationTitle = payload.notification?.title || "BOS Games";
  const notificationOptions = {
    body: payload.notification?.body || "New notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.tag || "default",
    data: payload.data || {},
    actions:
      payload.data?.type === "match_found"
        ? [
            {
              action: "accept_match",
              title: "Accept Match",
              icon: "/favicon.ico",
            },
            {
              action: "decline_match",
              title: "Decline Match",
              icon: "/favicon.ico",
            },
            {
              action: "close",
              title: "Close",
              icon: "/favicon.ico",
            },
          ]
        : payload.data?.type === "friend_request"
        ? [
            {
              action: "accept_friend",
              title: "Accept",
              icon: "/favicon.ico",
            },
            {
              action: "decline_friend",
              title: "Decline",
              icon: "/favicon.ico",
            },
            {
              action: "close",
              title: "Close",
              icon: "/favicon.ico",
            },
          ]
        : payload.data?.type === "team_invite"
        ? [
            {
              action: "accept_team",
              title: "Accept",
              icon: "/favicon.ico",
            },
            {
              action: "decline_team",
              title: "Decline",
              icon: "/favicon.ico",
            },
            {
              action: "close",
              title: "Close",
              icon: "/favicon.ico",
            },
          ]
        : payload.data?.type === "party_invite"
        ? [
            {
              action: "accept_party",
              title: "Accept",
              icon: "/favicon.ico",
            },
            {
              action: "decline_party",
              title: "Decline",
              icon: "/favicon.ico",
            },
            {
              action: "close",
              title: "Close",
              icon: "/favicon.ico",
            },
          ]
        : [
            {
              action: "view",
              title: "View",
              icon: "/favicon.ico",
            },
            {
              action: "close",
              title: "Close",
              icon: "/favicon.ico",
            },
          ],
    requireInteraction: [
      "match_found",
      "friend_request",
      "team_invite",
      "party_invite",
    ].includes(payload.data?.type),
    silent: false,
  };

  // Show the notification
  const notificationPromise = self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );

  // If this is a match acceptance notification, also send a message to the app to show the modal
  if (payload.data?.type === "match_found" && payload.data?.matchId) {
    console.log(
      "Background match notification received, will trigger modal when app becomes active"
    );

    // Store the match data for when the app becomes active
    const matchData = {
      type: "match_found",
      matchId: payload.data.matchId,
      timestamp: Date.now(),
    };

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set("matchDataForModal", matchData);
    console.log("Match data for modal:", matchData);
    console.log("Stored matchDataForModal in persistent storage:", {
      hasData: true,
      data: matchData,
      timestamp: Date.now(),
    });
    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      clientList.forEach(function (client) {
        console.log(
          "Sending MATCH_FOUND message to active client for modal display"
        );
        client.postMessage(matchData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  // If this is a match started notification, also send a message to the app to show the server connection modal
  if (payload.data?.type === "match_started" && payload.data?.matchId) {
    console.log(
      "Background match started notification received, will trigger server connection modal when app becomes active"
    );

    // Store the match started data for when the app becomes active
    const matchStartedData = {
      type: "match_started",
      matchId: payload.data.matchId,
      serverIp: payload.data.serverIp,
      serverPort: payload.data.serverPort,
      selectedMap: payload.data.selectedMap,
      timestamp: Date.now(),
    };

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set("matchStartedDataForModal", matchStartedData);

    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      clientList.forEach(function (client) {
        console.log(
          "Sending MATCH_STARTED message to active client for server connection modal display"
        );
        client.postMessage(matchStartedData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  // If this is a round completed notification, send a message to update the live match
  if (payload.data?.type === "round_completed" && payload.data?.matchId) {
    console.log(
      "Background round completed notification received, will update live match when app becomes active"
    );
    console.log("Round completion payload data:", payload.data);

    // Store the round completion data for when the app becomes active
    const roundCompletedData = {
      type: "round_completed",
      matchId: payload.data.matchId,
      team1Score: payload.data.data?.team1?.stats?.score,
      team2Score: payload.data.data?.team2?.stats?.score,
      players: payload.data.data?.players || [],
      timestamp: Date.now(),
    };

    console.log("Round completed data to store:", roundCompletedData);

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set("roundCompletedDataForModal", roundCompletedData);

    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      console.log("Active clients found:", clientList.length);
      clientList.forEach(function (client) {
        console.log(
          "Sending ROUND_COMPLETED message to active client for live match update"
        );
        client.postMessage(roundCompletedData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  // If this is a match completed notification, send a message to update the live match
  if (payload.data?.type === "match_completed" && payload.data?.matchId) {
    console.log(
      "Background match completed notification received, will update live match when app becomes active"
    );
    console.log("Match completion payload data:", payload.data);

    // Store the match completion data for when the app becomes active
    const matchCompletedData = {
      type: "match_completed",
      matchId: payload.data.matchId,
      winner: payload.data.winner,
      finalTeam1Score: payload.data.data?.team1?.stats?.score,
      finalTeam2Score: payload.data.data?.team2?.stats?.score,
      players: payload.data.data?.players || [],
      timestamp: Date.now(),
    };

    console.log("Match completed data to store:", matchCompletedData);

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set("matchCompletedDataForModal", matchCompletedData);

    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      console.log(
        "Active clients found for match completion:",
        clientList.length
      );
      clientList.forEach(function (client) {
        console.log(
          "Sending MATCH_COMPLETED message to active client for live match update"
        );
        client.postMessage(matchCompletedData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  // If this is a player update notification, send a message to update the live match
  if (payload.data?.type === "player_update" && payload.data?.matchId) {
    console.log(
      "Background player update notification received, will update live match when app becomes active"
    );
    console.log("Player update payload data:", payload.data);

    // Store the player update data for when the app becomes active
    const playerUpdateData = {
      type: "player_update",
      matchId: payload.data.matchId,
      steamId: payload.data.steamId,
      stats: payload.data.stats,
      timestamp: Date.now(),
    };

    console.log("Player update data to store:", playerUpdateData);

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set("playerUpdateDataForModal", playerUpdateData);

    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      console.log("Active clients found for player update:", clientList.length);
      clientList.forEach(function (client) {
        console.log(
          "Sending PLAYER_UPDATE message to active client for live match update"
        );
        client.postMessage(playerUpdateData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  // If this is a map banning started notification, also send a message to the app to show the map banning modal
  if (payload.data?.type === "map_banning_started" && payload.data?.matchId) {
    console.log(
      "Background map banning started notification received, will trigger map banning modal when app becomes active"
    );

    // Store the map banning data for when the app becomes active
    const mapBanningData = {
      type: "map_banning_started",
      matchId: payload.data.matchId,
      timestamp: Date.now(),
    };

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set("mapBanningDataForModal", mapBanningData);

    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      clientList.forEach(function (client) {
        console.log(
          "Sending MAP_BANNING_STARTED message to active client for map banning modal display"
        );
        client.postMessage(mapBanningData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  // If this is a map banned notification, send a message to update the modal
  if (payload.data?.type === "map_banned" && payload.data?.matchId) {
    console.log(
      "Background map banned notification received, will update map banning modal when app becomes active"
    );

    // Store the map banned data for when the app becomes active
    const mapBannedData = {
      type: "map_banned",
      matchId: payload.data.matchId,
      bannedMap: payload.data.bannedMap,
      remainingMaps: payload.data.remainingMaps,
      currentLeaderIndex: payload.data.currentLeaderIndex,
      timestamp: Date.now(),
    };

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set("mapBannedDataForModal", mapBannedData);

    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      clientList.forEach(function (client) {
        console.log(
          "Sending MAP_BANNED message to active client for map banning modal update"
        );
        client.postMessage(mapBannedData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  // If this is a map banning complete notification, send a message to close the modal
  if (payload.data?.type === "map_banning_complete" && payload.data?.matchId) {
    console.log(
      "Background map banning complete notification received, will show server connection modal when app becomes active"
    );

    // Store the map banning complete data for when the app becomes active
    const mapBanningCompleteData = {
      type: "map_banning_complete",
      matchId: payload.data.matchId,
      selectedMap: payload.data.selectedMap,
      timestamp: Date.now(),
    };

    // Store in persistent storage for persistence across service worker restarts
    await swStorage.set(
      "mapBanningCompleteDataForModal",
      mapBanningCompleteData
    );

    // Also try to send message to any active clients immediately
    const messagePromise = clients.matchAll().then(function (clientList) {
      clientList.forEach(function (client) {
        console.log(
          "Sending MAP_BANNING_COMPLETE message to active client for server connection modal display"
        );
        client.postMessage(mapBanningCompleteData);
      });
    });

    return Promise.all([notificationPromise, messagePromise]);
  }

  return notificationPromise;
});

// Handle notification clicks
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data;

  if (event.action === "accept_match" && data && data.matchId) {
    console.log("User accepted match:", data.matchId);
    event.waitUntil(
      clients.matchAll().then(function (clientList) {
        clientList.forEach(function (client) {
          client.postMessage({
            type: "match_accept",
            matchId: data.matchId,
          });
        });
      })
    );
  } else if (event.action === "decline_match" && data && data.matchId) {
    console.log("User declined match:", data.matchId);
    event.waitUntil(
      clients.matchAll().then(function (clientList) {
        clientList.forEach(function (client) {
          client.postMessage({
            type: "match_decline",
            matchId: data.matchId,
          });
        });
      })
    );
  } else if (event.action === "accept_friend" && data && data.requestId) {
    console.log("User accepted friend request:", data.requestId);
    event.waitUntil(
      clients.matchAll().then(function (clientList) {
        clientList.forEach(function (client) {
          client.postMessage({
            type: "friend_request_accept",
            requestId: data.requestId,
          });
        });
      })
    );
  } else if (event.action === "decline_friend" && data && data.requestId) {
    console.log("User declined friend request:", data.requestId);
    event.waitUntil(
      clients.matchAll().then(function (clientList) {
        clientList.forEach(function (client) {
          client.postMessage({
            type: "friend_request_decline",
            requestId: data.requestId,
          });
        });
      })
    );
  } else if (event.action === "accept_team" && data && data.inviteId) {
    console.log("User accepted team invite:", data.inviteId);
    event.waitUntil(
      clients.matchAll().then(function (clientList) {
        clientList.forEach(function (client) {
          client.postMessage({
            type: "team_invite_accept",
            inviteId: data.inviteId,
          });
        });
      })
    );
  } else if (event.action === "decline_team" && data && data.inviteId) {
    console.log("User declined team invite:", data.inviteId);
    event.waitUntil(
      clients.matchAll().then(function (clientList) {
        clientList.forEach(function (client) {
          client.postMessage({
            type: "team_invite_decline",
            inviteId: data.inviteId,
          });
        });
      })
    );
  } else if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Handle messages from the main app
self.addEventListener("message", async function (event) {
  console.log("Service worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("Received SKIP_WAITING message, skipping waiting");
    self.skipWaiting();
  } else if (event.data && event.data.type === "CHECK_PENDING_MATCH") {
    console.log(
      "CHECK_PENDING_MATCH message received, checking for stored data"
    );

    // Check for pending match data from persistent storage
    const checkPendingData = async () => {
      try {
        // Check for match data
        const matchData = await swStorage.get("matchDataForModal");
        console.log("Retrieved matchDataForModal from storage:", matchData);

        if (matchData) {
          const timeSinceReceived = Date.now() - matchData.timestamp;
          console.log("Time since received:", timeSinceReceived, "ms");
          console.log("5 minutes in ms:", 5 * 60 * 1000);

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log("Sending pending match data to main app");
            event.ports[0].postMessage(matchData);
            // Clear the data after successfully sending it
            await swStorage.delete("matchDataForModal");
          } else {
            console.log("Match data is too old, clearing it");
            await swStorage.delete("matchDataForModal");
          }
          return;
        }

        // Check for match started data
        const matchStartedData = await swStorage.get(
          "matchStartedDataForModal"
        );
        console.log(
          "Retrieved matchStartedDataForModal from storage:",
          matchStartedData
        );

        if (matchStartedData) {
          const timeSinceReceived = Date.now() - matchStartedData.timestamp;
          console.log(
            "Time since match started received:",
            timeSinceReceived,
            "ms"
          );

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log("Sending pending match started data to main app");
            event.ports[0].postMessage(matchStartedData);
            // Clear the data after successfully sending it
            await swStorage.delete("matchStartedDataForModal");
          } else {
            console.log("Match started data is too old, clearing it");
            await swStorage.delete("matchStartedDataForModal");
          }
          return;
        }

        // Check for map banning data
        const mapBanningData = await swStorage.get("mapBanningDataForModal");
        console.log(
          "Retrieved mapBanningDataForModal from storage:",
          mapBanningData
        );

        if (mapBanningData) {
          const timeSinceReceived = Date.now() - mapBanningData.timestamp;
          console.log(
            "Time since map banning received:",
            timeSinceReceived,
            "ms"
          );

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log("Sending pending map banning data to main app");
            event.ports[0].postMessage(mapBanningData);
            // Clear the data after successfully sending it
            await swStorage.delete("mapBanningDataForModal");
          } else {
            console.log("Map banning data is too old, clearing it");
            await swStorage.delete("mapBanningDataForModal");
          }
          return;
        }

        // Check for map banned data
        const mapBannedData = await swStorage.get("mapBannedDataForModal");
        console.log(
          "Retrieved mapBannedDataForModal from storage:",
          mapBannedData
        );

        if (mapBannedData) {
          const timeSinceReceived = Date.now() - mapBannedData.timestamp;
          console.log(
            "Time since map banned received:",
            timeSinceReceived,
            "ms"
          );

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log("Sending pending map banned data to main app");
            event.ports[0].postMessage(mapBannedData);
            // Clear the data after successfully sending it
            await swStorage.delete("mapBannedDataForModal");
          } else {
            console.log("Map banned data is too old, clearing it");
            await swStorage.delete("mapBannedDataForModal");
          }
          return;
        }

        // Check for map banning complete data
        const mapBanningCompleteData = await swStorage.get(
          "mapBanningCompleteDataForModal"
        );
        console.log(
          "Retrieved mapBanningCompleteDataForModal from storage:",
          mapBanningCompleteData
        );

        if (mapBanningCompleteData) {
          const timeSinceReceived =
            Date.now() - mapBanningCompleteData.timestamp;
          console.log(
            "Time since map banning complete received:",
            timeSinceReceived,
            "ms"
          );

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log(
              "Sending pending map banning complete data to main app"
            );
            event.ports[0].postMessage(mapBanningCompleteData);
            // Clear the data after successfully sending it
            await swStorage.delete("mapBanningCompleteDataForModal");
          } else {
            console.log("Map banning complete data is too old, clearing it");
            await swStorage.delete("mapBanningCompleteDataForModal");
          }
          return;
        }

        // Check for round completed data
        const roundCompletedData = await swStorage.get(
          "roundCompletedDataForModal"
        );
        console.log(
          "Retrieved roundCompletedDataForModal from storage:",
          roundCompletedData
        );

        if (roundCompletedData) {
          const timeSinceReceived = Date.now() - roundCompletedData.timestamp;
          console.log(
            "Time since round completed received:",
            timeSinceReceived,
            "ms"
          );

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log("Sending pending round completed data to main app");
            event.ports[0].postMessage(roundCompletedData);
            // Clear the data after successfully sending it
            await swStorage.delete("roundCompletedDataForModal");
          } else {
            console.log("Round completed data is too old, clearing it");
            await swStorage.delete("roundCompletedDataForModal");
          }
          return;
        }

        // Check for match completed data
        const matchCompletedData = await swStorage.get(
          "matchCompletedDataForModal"
        );
        console.log(
          "Retrieved matchCompletedDataForModal from storage:",
          matchCompletedData
        );

        if (matchCompletedData) {
          const timeSinceReceived = Date.now() - matchCompletedData.timestamp;
          console.log(
            "Time since match completed received:",
            timeSinceReceived,
            "ms"
          );

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log("Sending pending match completed data to main app");
            event.ports[0].postMessage(matchCompletedData);
            // Clear the data after successfully sending it
            await swStorage.delete("matchCompletedDataForModal");
          } else {
            console.log("Match completed data is too old, clearing it");
            await swStorage.delete("matchCompletedDataForModal");
          }
          return;
        }

        // Check for player update data
        const playerUpdateData = await swStorage.get(
          "playerUpdateDataForModal"
        );
        console.log(
          "Retrieved playerUpdateDataForModal from storage:",
          playerUpdateData
        );

        if (playerUpdateData) {
          const timeSinceReceived = Date.now() - playerUpdateData.timestamp;
          console.log(
            "Time since player update received:",
            timeSinceReceived,
            "ms"
          );

          if (timeSinceReceived < 5 * 60 * 1000) {
            console.log("Sending pending player update data to main app");
            event.ports[0].postMessage(playerUpdateData);
            // Clear the data after successfully sending it
            await swStorage.delete("playerUpdateDataForModal");
          } else {
            console.log("Player update data is too old, clearing it");
            await swStorage.delete("playerUpdateDataForModal");
          }
          return;
        }

        console.log("No stored match data found");
      } catch (error) {
        console.error("Error checking pending data:", error);
      }
    };

    // Execute the async check
    checkPendingData();
  } else if (event.data && event.data.type === "SIMULATE_BACKGROUND_MESSAGE") {
    // Simulate a background message for testing
    console.log("Simulating background message:", event.data.payload);

    const payload = event.data.payload;

    // Process the simulated background message
    const notificationTitle = payload.notification?.title || "BOS Games";
    const notificationOptions = {
      body: payload.notification?.body || "New notification",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.data?.tag || "default",
      data: payload.data || {},
      actions:
        payload.data?.action === "accept_match"
          ? [
              {
                action: "accept_match",
                title: "Accept Match",
                icon: "/favicon.ico",
              },
              {
                action: "decline_match",
                title: "Decline Match",
                icon: "/favicon.ico",
              },
              {
                action: "close",
                title: "Close",
                icon: "/favicon.ico",
              },
            ]
          : [
              {
                action: "view",
                title: "View",
                icon: "/favicon.ico",
              },
              {
                action: "close",
                title: "Close",
                icon: "/favicon.ico",
              },
            ],
      requireInteraction: [
        "accept_match",
        "friend_request",
        "team_invite",
      ].includes(payload.data?.action),
      silent: false,
    };

    // Show the notification
    const notificationPromise = self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );

    // If this is a match acceptance notification, also send a message to the app to show the modal
    if (payload.data?.action === "accept_match" && payload.data?.matchId) {
      console.log(
        "Simulated background match notification received, will trigger modal when app becomes active"
      );

      // Store the match data for when the app becomes active
      const matchData = {
        type: "match_found",
        matchId: payload.data.matchId,
        timestamp: Date.now(),
      };

      // Store in persistent storage for persistence across service worker restarts
      await swStorage.set("matchDataForModal", matchData);

      // Also try to send message to any active clients immediately
      const messagePromise = clients.matchAll().then(function (clientList) {
        clientList.forEach(function (client) {
          console.log(
            "Sending simulated MATCH_FOUND message to active client for modal display"
          );
          client.postMessage(matchData);
        });
      });

      return Promise.all([notificationPromise, messagePromise]);
    }

    return notificationPromise;
  } else if (event.data && event.data.type === "CLEAR_PENDING_MATCH") {
    // Clear any stored match data
    console.log("Clearing pending match data");
    await swStorage.delete("matchDataForModal");
    await swStorage.delete("matchStartedDataForModal");
    await swStorage.delete("mapBanningDataForModal");
    await swStorage.delete("mapBannedDataForModal");
    await swStorage.delete("mapBanningCompleteDataForModal");
    await swStorage.delete("roundCompletedDataForModal");
    await swStorage.delete("matchCompletedDataForModal");
    await swStorage.delete("playerUpdateDataForModal");
  } else if (event.data && event.data.type === "CLEAR_MAP_BANNING_DATA") {
    // Clear map banning related data for a specific match
    console.log("Clearing map banning data for match:", event.data.matchId);
    await swStorage.delete("mapBanningDataForModal");
    await swStorage.delete("mapBannedDataForModal");
    await swStorage.delete("mapBanningCompleteDataForModal");
  } else if (event.data && event.data.type === "DEBUG_STATE") {
    // Debug function to check current state
    console.log("=== Service Worker Debug State ===");

    const checkDebugState = async () => {
      try {
        const matchDataForModal = await swStorage.get("matchDataForModal");
        const matchStartedDataForModal = await swStorage.get(
          "matchStartedDataForModal"
        );
        const mapBanningDataForModal = await swStorage.get(
          "mapBanningDataForModal"
        );
        const roundCompletedDataForModal = await swStorage.get(
          "roundCompletedDataForModal"
        );
        const matchCompletedDataForModal = await swStorage.get(
          "matchCompletedDataForModal"
        );
        const playerUpdateDataForModal = await swStorage.get(
          "playerUpdateDataForModal"
        );

        console.log("matchDataForModal:", matchDataForModal);
        console.log("matchStartedDataForModal:", matchStartedDataForModal);
        console.log("mapBanningDataForModal:", mapBanningDataForModal);
        console.log("roundCompletedDataForModal:", roundCompletedDataForModal);
        console.log("matchCompletedDataForModal:", matchCompletedDataForModal);
        console.log("playerUpdateDataForModal:", playerUpdateDataForModal);
        console.log("Current timestamp:", Date.now());

        if (matchDataForModal) {
          const timeSinceReceived = Date.now() - matchDataForModal.timestamp;
          console.log(
            "Time since match data received:",
            timeSinceReceived,
            "ms"
          );
        }

        // Send debug info back to client
        event.ports[0].postMessage({
          type: "DEBUG_STATE_RESPONSE",
          matchDataForModal: matchDataForModal,
          matchStartedDataForModal: matchStartedDataForModal,
          mapBanningDataForModal: mapBanningDataForModal,
          roundCompletedDataForModal: roundCompletedDataForModal,
          matchCompletedDataForModal: matchCompletedDataForModal,
          playerUpdateDataForModal: playerUpdateDataForModal,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Error checking debug state:", error);
      }
    };

    checkDebugState();
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("Notification closed:", event);
});

self.addEventListener("install", function (event) {
  console.log("Firebase messaging service worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("Firebase messaging service worker activating...");
  event.waitUntil(
    Promise.all([
      clients.claim(), // Take control of all clients immediately
      // Clear any old caches if needed
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== "firebase-messaging-sw-cache") {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
    ])
  );
});

self.addEventListener("controllerchange", (evt) => {
  console.log("controller changed");
  self.controller = navigator.serviceWorker.controller;
});

self.addEventListener("sync", function (event) {
  console.log("Background sync:", event);
});
