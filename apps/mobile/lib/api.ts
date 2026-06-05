import Constants from "expo-constants";

const PRODUCTION_API_URL = "https://audio-story-platform-web-vot4.vercel.app";
const fallbackBaseUrl = "http://192.168.1.151:3000";

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

  const configUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof configUrl === "string" && configUrl) {
    return configUrl.replace(/\/$/, "");
  }

  // In production builds (no dev server host), always use the deployed API
  if (!__DEV__) {
    return PRODUCTION_API_URL;
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

export async function postJson<T>(path: string, body: unknown) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorBody?.error ?? `Request failed: ${response.status} (${baseUrl}${path})`);
  }

  return (await response.json()) as T;
}
