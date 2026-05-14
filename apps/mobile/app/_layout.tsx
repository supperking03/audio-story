import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { AudioSessionManager } from "../components/audio-session-manager";
import { MiniPlayer } from "../components/mini-player";
import { PlayerMetaProvider } from "../contexts/player-context";

export default function RootLayout() {
  return (
    <PlayerMetaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <AudioSessionManager />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0A0B11" }
          }}
        />
        <MiniPlayer />
      </View>
    </PlayerMetaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#0A0B11",
    flex: 1,
  },
});
