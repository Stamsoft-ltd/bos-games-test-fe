import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface PushTokenDto {
  token: string;
}

export const setPushToken = async (token: string, authToken: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/push-token`,
    { token },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return response.data;
};

export const removePushToken = async (token: string, authToken: string) => {
  const response = await axios.delete(`${API_BASE_URL}/push-token`, {
    data: { token },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return response.data;
};
