import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { postJson } from "./api";

const STORAGE_KEY = "bubu_push_token";
const PREF_KEY = "bubu_notif_wants_new_content";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getStoredPushPreference(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(PREF_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function getExpoPushToken(): Promise<string | null> {
  try {
    const existing = await Notifications.getPermissionsAsync() as { granted: boolean };
    let granted = existing.granted;

    if (!granted) {
      const result = await Notifications.requestPermissionsAsync() as { granted: boolean };
      granted = result.granted;
    }

    if (!granted) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    console.log("[push] device token:", tokenData.data);
    return tokenData.data as string;
  } catch (e) {
    console.error("[push] getDeviceToken error:", e);
    return null;
  }
}

export async function savePushPreference(wantsNewContent: boolean): Promise<boolean> {
  try {
    let token = await getStoredPushToken();

    if (wantsNewContent && !token) {
      token = await getExpoPushToken();
      if (!token) return false;
      await AsyncStorage.setItem(STORAGE_KEY, token);
    }

    await AsyncStorage.setItem(PREF_KEY, String(wantsNewContent));

    if (token) {
      try {
        await postJson("/api/mobile/push-tokens", {
          token,
          platform: Platform.OS,
          wantsNewContent,
        });
        console.log("[push] token registered to server OK");
      } catch (e) {
        console.error("[push] register token failed:", e);
      }
    }

    return true;
  } catch (e) {
    console.error("[push] savePushPreference error:", e);
    return false;
  }
}
