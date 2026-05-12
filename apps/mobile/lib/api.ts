import Constants from "expo-constants";

const fallbackBaseUrl = "http://192.168.1.145:3000";

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.experienceUrl?.replace(/^exp:\/\//, "") ??
    null;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0];
}

export function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:3000`;
  }

  return fallbackBaseUrl;
}

export async function fetchJson<T>(path: string) {
  const response = await fetch(`${getApiBaseUrl()}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
