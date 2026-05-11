import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { continueListening } from "../../constants/mock-data";
import { theme } from "../../constants/theme";

const speedOptions = ["0.8x", "1.0x", "1.2x", "1.5x", "2.0x"];

export default function PlayerScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.content}>
        <LinearGradient colors={["#5C1A1B", "#A63D40", "#E09F3E"]} style={styles.coverArt}>
          <Text style={styles.coverTitle}>{continueListening.title}</Text>
          <Text style={styles.coverEpisode}>{continueListening.episodeTitle}</Text>
        </LinearGradient>

        <View style={styles.metaSection}>
          <Text style={styles.storyEpisode}>Còn 9 phút</Text>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineTrack}>
            <View style={[styles.timelineFill, { width: `${continueListening.progress * 100}%` }]} />
          </View>
          <View style={styles.timelineLabels}>
            <Text style={styles.timelineText}>18:42</Text>
            <Text style={styles.timelineText}>27:31</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <ControlButton icon="rotate-ccw" label="15s" />
          <ControlButton icon="skip-back" label="" />
          <Pressable style={styles.primaryButton}>
            <Feather color="#11131C" name="pause" size={26} />
          </Pressable>
          <ControlButton icon="skip-forward" label="" />
          <ControlButton icon="rotate-cw" label="30s" />
        </View>

        <View style={styles.speedRow}>
          {speedOptions.map((option) => (
            <View key={option} style={[styles.speedChip, option === "1.2x" && styles.speedChipActive]}>
              <Text style={[styles.speedText, option === "1.2x" && styles.speedTextActive]}>{option}</Text>
            </View>
          ))}
        </View>

        <View style={styles.utilityRow}>
          <UtilityTile label="Sleep" value="30p" />
          <UtilityTile label="Episodes" value="42" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ControlButton({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
  return (
    <Pressable style={styles.controlButton}>
      <Feather color={theme.colors.text} name={icon} size={22} />
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

function UtilityTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.utilityTile}>
      <Text style={styles.utilityLabel}>{label}</Text>
      <Text style={styles.utilityValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  content: {
    flex: 1,
    gap: theme.spacing.xl,
    padding: theme.spacing.lg
  },
  coverArt: {
    borderRadius: 32,
    gap: 6,
    minHeight: 320,
    justifyContent: "flex-end",
    padding: 24
  },
  coverTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800"
  },
  coverEpisode: {
    color: "#FFF3D1",
    fontSize: 15
  },
  metaSection: {
    gap: 4
  },
  storyEpisode: {
    color: theme.colors.textMuted,
    fontSize: 14
  },
  timeline: {
    gap: 10
  },
  timelineTrack: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    height: 8,
    overflow: "hidden"
  },
  timelineFill: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    height: "100%"
  },
  timelineLabels: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  timelineText: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  controlButton: {
    alignItems: "center",
    gap: 2,
    minWidth: 36
  },
  controlLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  speedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  speedChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  speedChipActive: {
    backgroundColor: theme.colors.accent
  },
  speedText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  speedTextActive: {
    color: "#11131C"
  },
  utilityRow: {
    flexDirection: "row",
    gap: 12
  },
  utilityTile: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: theme.spacing.md
  },
  utilityLabel: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  utilityValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700"
  }
});
