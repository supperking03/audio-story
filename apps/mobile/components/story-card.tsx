import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { StorySeries } from "../data/story-service";
import { theme } from "../constants/theme";

type StoryCardProps = {
  series: StorySeries;
  compact?: boolean;
  onPress?: () => void;
};

export function StoryCard({ series, compact = false, onPress }: StoryCardProps) {
  const metaParts = [series.author, series.tags[0]].filter(Boolean);

  return (
    <Pressable onPress={onPress}>
      <LinearGradient colors={series.coverColor} style={[styles.card, compact && styles.compactCard]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{series.latestEpisodeLabel}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.mood}>{series.mood}</Text>
          <Text style={styles.title}>{series.title}</Text>
          <View style={styles.metaRow}>
            {metaParts.map((part, index) => (
              <View key={`${series.id}-meta-${part}-${index}`} style={styles.metaItem}>
                {index > 0 ? <Text style={styles.dot}>•</Text> : null}
                <Text style={styles.author}>{part}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
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
  metaItem: {
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
