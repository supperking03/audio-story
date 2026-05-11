import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import type { StorySeries } from "../constants/mock-data";
import { theme } from "../constants/theme";

type StoryCardProps = {
  series: StorySeries;
  compact?: boolean;
};

export function StoryCard({ series, compact = false }: StoryCardProps) {
  return (
    <LinearGradient colors={series.coverColor} style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{series.latestEpisodeLabel}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.mood}>{series.mood}</Text>
        <Text style={styles.title}>{series.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.author}>{series.author}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.author}>{series.tags[0]}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    minHeight: 220,
    overflow: "hidden",
    padding: theme.spacing.lg,
    width: 280
  },
  compactCard: {
    minHeight: 180,
    width: "100%"
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(10, 11, 17, 0.35)",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700"
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 6
  },
  mood: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800"
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  author: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600"
  },
  dot: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12
  }
});
