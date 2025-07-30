import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getMyNotifications = async (
  authToken: string,
  page: number = 1,
  limit: number = 20
) => {
  const response = await axios.get(
    `${API_BASE_URL}/notification/mine?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return response.data as NotificationsResponse;
};

export const markNotificationAsRead = async (
  notificationId: string,
  authToken: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/notification/mark-as-read/${notificationId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return response.data;
};

export const markAllNotificationsAsRead = async (authToken: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/notification/mark-all-as-read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return response.data;
};
