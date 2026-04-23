import axios from "axios";

export const apiClient = axios.create();

export async function getJson(url, config) {
  const response = await apiClient.get(url, config);
  return response.data;
}
