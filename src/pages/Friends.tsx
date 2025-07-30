import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllUsers, getFriends, searchUsers } from "../api/user";
import { getMe } from "../api/auth";
import {
  sendFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from "../api/friend";

export default function FriendsPage() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token") || "";
  const [users, setUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Check authentication
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
  }, [token, navigate]);

  useEffect(() => {
    console.log("Fetching friends data...", token);
    if (token) {
      Promise.all([
        getAllUsers(token),
        getFriends(token),
        getReceivedFriendRequests(token),
        getSentFriendRequests(token),
        getMe(token),
      ])
        .then(
          ([
            usersData,
            friendsData,
            receivedData,
            sentData,
            currentUserData,
          ]) => {
            setUsers(usersData.data || usersData); // Handle both paginated and non-paginated responses
            setFriends(friendsData);
            setReceived(receivedData);
            setSent(sentData);
            setCurrentUser(currentUserData);
            // Store current user ID for easy access
            sessionStorage.setItem("userId", currentUserData.id);
          }
        )
        .catch((error) => {
          console.error("Error loading data:", error);
          setStatus("Error loading data");
          // If token is invalid, redirect to login
          if (error?.response?.status === 401) {
            sessionStorage.removeItem("token");
            navigate("/login");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token, navigate]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (!token) return;

          setSearchLoading(true);
          try {
            const searchResults = await searchUsers(token, searchQuery, 20);
            setUsers(searchResults);
          } catch (error) {
            console.error("Error searching users:", error);
            setStatus("Error searching users");
          } finally {
            setSearchLoading(false);
          }
        }, 300); // 300ms debounce
      };
    })(),
    [token]
  );

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      // If search is empty, load all users
      if (token) {
        setSearchLoading(true);
        getAllUsers(token)
          .then((response) => setUsers(response.data || response)) // Handle both paginated and non-paginated responses
          .catch((error) => {
            console.error("Error loading all users:", error);
            setStatus("Error loading users");
          })
          .finally(() => setSearchLoading(false));
      }
    } else {
      // Perform debounced search
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch, token]);

  async function handleSendRequest(userId: string) {
    try {
      await sendFriendRequest(userId, token);
      setStatus("Friend request sent!");
      // Refresh sent requests
      const sentData = await getSentFriendRequests(token);
      setSent(sentData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  }

  // Helper function to determine user status and appropriate action
  const getUserStatus = (user: any) => {
    const currentUserId = sessionStorage.getItem("userId");

    // Don't show actions for current user
    if (user.id === currentUserId) {
      return { status: "current_user", text: "You", action: null };
    }

    // Check if user is already a friend
    const isFriend = friends.some((friend) => friend.id === user.id);
    if (isFriend) {
      return { status: "friend", text: "Friend", action: null };
    }

    // Check if friend request was sent
    const requestSent = sent.some((req) => req.to?.id === user.id);
    if (requestSent) {
      return { status: "request_sent", text: "Request Sent", action: null };
    }

    // Check if friend request was received
    const requestReceived = received.some((req) => req.from?.id === user.id);
    if (requestReceived) {
      return {
        status: "request_received",
        text: "Accept/Decline",
        action: "respond",
        requestId: received.find((req) => req.from?.id === user.id)?.id,
      };
    }

    // User is available to add as friend
    return { status: "available", text: "Add Friend", action: "add" };
  };

  // Handle friend request response
  const handleFriendRequestResponse = async (
    requestId: string,
    action: "accept" | "decline"
  ) => {
    try {
      if (action === "accept") {
        await acceptFriendRequest(requestId, token);
        setStatus("Friend request accepted!");
      } else {
        await declineFriendRequest(requestId, token);
        setStatus("Friend request declined!");
      }

      // Refresh data
      const [friendsData, receivedData] = await Promise.all([
        getFriends(token),
        getReceivedFriendRequests(token),
      ]);
      setFriends(friendsData);
      setReceived(receivedData);
    } catch (error: any) {
      setStatus("Error: " + (error?.response?.data?.message || error.message));
    }
  };

  if (!token) {
    return <div className="text-center">Redirecting to login...</div>;
  }

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Friends</h1>
        <Link to="/dashboard" className="text-indigo-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {status && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          {status}
        </div>
      )}

      {/* Current Friends */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          👥 My Friends ({friends.length})
        </h2>
        {friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {friends.map((friend) => (
              <div key={friend.id} className="p-2 bg-gray-50 rounded">
                {friend.nickname || friend.email}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No friends yet. Send some friend requests below!
          </p>
        )}
      </div>

      {/* Received Friend Requests */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          📥 Received Friend Requests ({received.length})
        </h2>
        {received.length > 0 ? (
          <div className="space-y-2">
            {received.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-2 bg-yellow-50 rounded"
              >
                <span>From: {req.from?.nickname || req.from?.email}</span>
                <div className="space-x-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    onClick={() =>
                      handleFriendRequestResponse(req.id, "accept")
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    onClick={() =>
                      handleFriendRequestResponse(req.id, "decline")
                    }
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending friend requests</p>
        )}
      </div>

      {/* Sent Friend Requests */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          📤 Sent Friend Requests ({sent.length})
        </h2>
        {sent.length > 0 ? (
          <div className="space-y-2">
            {sent.map((req) => (
              <div key={req.id} className="p-2 bg-blue-50 rounded">
                To: {req.to?.nickname || req.to?.email}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No sent friend requests</p>
        )}
      </div>

      {/* All Users */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          👥 All Users ({users.length})
        </h2>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by nickname or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {users.map((user) => {
            const status = getUserStatus(user);
            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-2 rounded ${
                  status.status === "current_user"
                    ? "bg-blue-100"
                    : status.status === "friend"
                    ? "bg-green-100"
                    : status.status === "request_sent"
                    ? "bg-yellow-100"
                    : status.status === "request_received"
                    ? "bg-orange-100"
                    : "bg-gray-50"
                }`}
              >
                <span className="flex-1">{user.nickname || user.email}</span>
                <div className="flex items-center space-x-2">
                  {status.status === "current_user" && (
                    <span className="text-blue-600 text-sm font-medium">
                      {status.text}
                    </span>
                  )}
                  {status.status === "friend" && (
                    <span className="text-green-600 text-sm font-medium">
                      {status.text}
                    </span>
                  )}
                  {status.status === "request_sent" && (
                    <span className="text-yellow-600 text-sm font-medium">
                      {status.text}
                    </span>
                  )}
                  {status.action === "add" && (
                    <button
                      className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                      onClick={() => handleSendRequest(user.id)}
                    >
                      Add Friend
                    </button>
                  )}
                  {status.action === "respond" && (
                    <div className="flex space-x-1">
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                        onClick={() =>
                          handleFriendRequestResponse(
                            status.requestId!,
                            "accept"
                          )
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        onClick={() =>
                          handleFriendRequestResponse(
                            status.requestId!,
                            "decline"
                          )
                        }
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {searchLoading && (
          <p className="text-gray-500 text-center mt-4">Searching...</p>
        )}

        {!searchLoading && users.length === 0 && searchTerm.trim() !== "" && (
          <p className="text-gray-500 text-center mt-4">
            No users found matching "{searchTerm}"
          </p>
        )}
      </div>
    </div>
  );
}
