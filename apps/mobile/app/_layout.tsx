import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AudioSessionManager } from "../components/audio-session-manager";
import { MiniPlayer } from "../components/mini-player";
import { PlayerMetaProvider } from "../contexts/player-context";

export default function RootLayout() {
  useEffect(() => {
    AsyncStorage.getItem("bubu_onboarding_done").then((done) => {
      if (!done) router.replace("/onboarding");
    });
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#0A0B11",
    flex: 1,
  },
});
