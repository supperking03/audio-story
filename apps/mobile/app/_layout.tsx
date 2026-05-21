import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppSplash } from "../components/app-splash";
import { AudioSessionManager } from "../components/audio-session-manager";
import { MiniPlayer } from "../components/mini-player";
import { PlayerMetaProvider } from "../contexts/player-context";

function navigateToSeriesFromNotif(response: Notifications.NotificationResponse) {
  const trigger = response.notification.request.trigger as Record<string, unknown> | null;
  console.log("[notif] trigger:", JSON.stringify(trigger));
  const content = response.notification.request.content;
  console.log("[notif] content.data:", JSON.stringify(content.data));

  const seriesId =
    (trigger?.payload as Record<string, unknown> | undefined)?.seriesId as string | undefined
    ?? ((trigger?.payload as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.seriesId as string | undefined
    ?? (content.data as Record<string, unknown> | null)?.seriesId as string | undefined;

  console.log("[notif] seriesId:", seriesId);
  if (seriesId) {
    router.push({ pathname: "/series/[id]", params: { id: seriesId } });
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const pendingNotif = useRef<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    async function init() {
      const [onboardingDone, notifResponse] = await Promise.all([
        AsyncStorage.getItem("bubu_onboarding_done"),
        Notifications.getLastNotificationResponseAsync(),
      ]);

      console.log("[init] onboardingDone:", onboardingDone);
      console.log("[init] lastNotifResponse:", notifResponse ? JSON.stringify(notifResponse.notification.request.content.data) : "null");

      if (!onboardingDone) router.replace("/onboarding");
      if (notifResponse) pendingNotif.current = notifResponse;

      setIsReady(true);
    }

    init().catch((e) => { console.error("[init] error:", e); setIsReady(true); });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[notif] listener fired, data:", JSON.stringify(response.notification.request.content.data));
      navigateToSeriesFromNotif(response);
    });
    return () => sub.remove();
  }, []);

  // Navigate after AppSplash finishes fading (350ms animation + buffer)
  useEffect(() => {
    if (!isReady || !pendingNotif.current) return;
    const notif = pendingNotif.current;
    pendingNotif.current = null;
    const timer = setTimeout(() => navigateToSeriesFromNotif(notif), 450);
    return () => clearTimeout(timer);
  }, [isReady]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <PlayerMetaProvider>
          <StatusBar style="light" />
          <AudioSessionManager />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0A0B11" }
            }}
          />
          <MiniPlayer />
        </PlayerMetaProvider>
      </BottomSheetModalProvider>
      <AppSplash visible={!isReady} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#0A0B11",
    flex: 1,
  },
});
