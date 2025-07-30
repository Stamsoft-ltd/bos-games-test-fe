import React, { useState, useEffect } from "react";
import { getMyNotifications } from "../api/notifications";

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({
  className = "",
}: NotificationBadgeProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    const fetchNotificationCount = async () => {
      try {
        setLoading(true);
        const response = await getMyNotifications(token, 1, 100);
        const unreadCount = response.data.filter((n) => !n.read).length;
        setCount(unreadCount);
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => clearInterval(interval);
  }, [token]);

  if (!token || count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full ${className}`}
    >
      {loading ? "..." : count > 99 ? "99+" : count}
    </span>
  );
}
