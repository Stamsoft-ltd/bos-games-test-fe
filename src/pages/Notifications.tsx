import React, { useState, useEffect } from "react";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from "../api/notifications";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (token) {
      loadNotifications();
    }
  }, [token, page]);

  const loadNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await getMyNotifications(token, page);
      setNotifications((prev) =>
        page === 1 ? response.data : [...prev, ...response.data]
      );
      setHasMore(response.meta.page < response.meta.totalPages);
      setError(null);
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      await markNotificationAsRead(notificationId, token);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;

    try {
      await markAllNotificationsAsRead(token);
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "match_completed":
        return "🎉";
      case "match_started":
        return "🚀";
      case "player_connected":
        return "👤";
      case "player_disconnected":
        return "⚠️";
      case "player_votekicked":
        return "🚫";
      case "match_cancelled":
        return "❌";
      case "round_completed":
        return "🎯";
      case "direct_message":
        return "💬";
      case "party_invite":
        return "📨";
      default:
        return "📢";
    }
  };

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <p className="text-gray-600">
          Please log in to view your notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {notifications.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white border rounded-lg p-4 shadow-sm ${
                !notification.read
                  ? "border-blue-200 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{notification.body}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                    {notification.data && (
                      <div className="mt-2 text-xs text-gray-500">
                        <details>
                          <summary className="cursor-pointer hover:text-gray-700">
                            View Details
                          </summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="ml-4 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center mt-6">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
