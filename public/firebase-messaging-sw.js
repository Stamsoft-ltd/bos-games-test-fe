// Firebase messaging service worker - required by Firebase Cloud Messaging
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

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
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);
  console.log("Payload data:", payload.data);
  console.log("Payload notification:", payload.notification);
  console.log("Action check:", payload.data?.action);
  console.log("MatchId check:", payload.data?.matchId);

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
        : payload.data?.action === "friend_request"
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
        : payload.data?.action === "team_invite"
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
      "Background match notification received, will trigger modal when app becomes active"
    );

    // Store the match data for when the app becomes active
    const matchData = {
      type: "MATCH_FOUND",
      matchId: payload.data.matchId,
      timestamp: Date.now(),
    };

    // Store in service worker memory for persistence
    self.matchDataForModal = matchData;
    console.log("Match data for modal:", self.matchDataForModal);
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
  if (payload.data?.action === "match_started" && payload.data?.matchId) {
    console.log(
      "Background match started notification received, will trigger server connection modal when app becomes active"
    );

    // Store the match started data for when the app becomes active
    const matchStartedData = {
      type: "MATCH_STARTED",
      matchId: payload.data.matchId,
      serverIp: payload.data.serverIp,
      serverPort: payload.data.serverPort,
      timestamp: Date.now(),
    };

    // Store in service worker memory for persistence
    self.matchStartedDataForModal = matchStartedData;

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
            type: "MATCH_ACCEPT",
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
            type: "MATCH_DECLINE",
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
            type: "FRIEND_REQUEST_ACCEPT",
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
            type: "FRIEND_REQUEST_DECLINE",
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
            type: "TEAM_INVITE_ACCEPT",
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
            type: "TEAM_INVITE_DECLINE",
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
self.addEventListener("message", function (event) {
  console.log("Service worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("Received SKIP_WAITING message, skipping waiting");
    self.skipWaiting();
  } else if (event.data && event.data.type === "CHECK_PENDING_MATCH") {
    console.log(
      "CHECK_PENDING_MATCH message received, checking for stored data"
    );
    console.log("Current stored matchDataForModal:", self.matchDataForModal);
    console.log(
      "Current stored matchStartedDataForModal:",
      self.matchStartedDataForModal
    );

    // Main app is asking if there's pending match data
    if (self.matchDataForModal) {
      const matchData = self.matchDataForModal;
      const timeSinceReceived = Date.now() - matchData.timestamp;

      console.log("Time since received:", timeSinceReceived, "ms");
      console.log("5 minutes in ms:", 5 * 60 * 1000);

      if (timeSinceReceived < 5 * 60 * 1000) {
        console.log("Sending pending match data to main app");
        event.ports[0].postMessage(matchData);
      } else {
        console.log("Match data is too old, clearing it");
        delete self.matchDataForModal;
      }
    } else if (self.matchStartedDataForModal) {
      const matchStartedData = self.matchStartedDataForModal;
      const timeSinceReceived = Date.now() - matchStartedData.timestamp;

      console.log(
        "Time since match started received:",
        timeSinceReceived,
        "ms"
      );

      if (timeSinceReceived < 5 * 60 * 1000) {
        console.log("Sending pending match started data to main app");
        event.ports[0].postMessage(matchStartedData);
      } else {
        console.log("Match started data is too old, clearing it");
        delete self.matchStartedDataForModal;
      }
    } else {
      console.log("No stored match data found");
    }

    // Clear stored data after checking
    delete self.matchDataForModal;
    delete self.matchStartedDataForModal;
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
        type: "MATCH_FOUND",
        matchId: payload.data.matchId,
        timestamp: Date.now(),
      };

      // Store in service worker memory for persistence
      self.matchDataForModal = matchData;

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
    delete self.matchDataForModal;
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
