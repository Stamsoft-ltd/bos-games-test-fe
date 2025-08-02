import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export enum PlatformEnum {
  IOS = "ios",
  ANDROID = "android",
  WEB = "web",
  WINDOWS = "windows",
}

export interface PushTokenDto {
  token: string;
  deviceId: string;
  platform?: PlatformEnum;
}

export const setPushToken = async (
  token: string,
  deviceId: string,
  platform?: PlatformEnum,
  authToken?: string
) => {
  const response = await axios.post(
    `${API_BASE_URL}/push-token`,
    {
      token,
      deviceId,
      platform,
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return response.data;
};

export const removePushToken = async (
  token: string,
  deviceId: string,
  authToken?: string
) => {
  const response = await axios.delete(`${API_BASE_URL}/push-token`, {
    data: { token, deviceId },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};
