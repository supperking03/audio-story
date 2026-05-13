import Constants from "expo-constants";

const fallbackBaseUrl = "http://192.168.101.42:3000";

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
    return envUrl.replace(/\/$/, "");
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:3000`;
  }

  return fallbackBaseUrl;
}

export async function fetchJson<T>(path: string) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} (${baseUrl}${path})`);
  }

  return (await response.json()) as T;
}
