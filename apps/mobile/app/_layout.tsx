import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppSplash } from "../components/app-splash";
import { AudioSessionManager } from "../components/audio-session-manager";
import { MiniPlayer } from "../components/mini-player";
import { PlayerMetaProvider } from "../contexts/player-context";

SplashScreen.preventAutoHideAsync().catch(() => {});

function navigateToSeriesFromNotif(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, unknown>;
  const seriesId = data?.seriesId as string | undefined;
  if (seriesId) {
    router.push({ pathname: "/series/[id]", params: { id: seriesId } });
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      const [onboardingDone, notifResponse] = await Promise.all([
        AsyncStorage.getItem("bubu_onboarding_done"),
        Notifications.getLastNotificationResponseAsync(),
      ]);

      if (!onboardingDone) router.replace("/onboarding");
      if (notifResponse) navigateToSeriesFromNotif(notifResponse);

      await SplashScreen.hideAsync();
      setIsReady(true);
    }

    init().catch(async () => {
      await SplashScreen.hideAsync();
      setIsReady(true);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(navigateToSeriesFromNotif);
    return () => sub.remove();
  }, []);

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
