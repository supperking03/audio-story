import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

import type { StorySeries } from "../data/story-service";
import { theme } from "../constants/theme";

type StoryCardProps = {
  series: StorySeries;
  compact?: boolean;
  onPress?: () => void;
  promotedTags?: string[];
};

function selectDisplayTags(seriesTags: string[], promotedTags: string[] = []) {
  const normalizedPromoted = promotedTags.map((tag) => tag.trim()).filter(Boolean);
  const uniqueSeriesTags = Array.from(new Set(seriesTags.map((tag) => tag.trim()).filter(Boolean)));

  const prioritized = normalizedPromoted.filter((tag) => uniqueSeriesTags.includes(tag));
  const fallback = uniqueSeriesTags.filter((tag) => !prioritized.includes(tag));

  return [...prioritized, ...fallback].slice(0, 2);
}

export function StoryCard({ series, compact = false, onPress, promotedTags = [] }: StoryCardProps) {
  const displayTags = selectDisplayTags(series.tags, promotedTags);
  const content = (
    <>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.mood}>{series.mood}</Text>
        <Text numberOfLines={compact ? 2 : 3} style={[styles.title, compact && styles.compactTitle]}>
          {series.title}
        </Text>
        <View style={styles.metaRow}>
          {displayTags.map((part, index) => (
            <View key={`${series.id}-meta-${part}-${index}`} style={styles.metaItem}>
              {index > 0 ? <Text style={styles.dot}>•</Text> : null}
              <Text numberOfLines={1} style={styles.tagText}>{part}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      {series.coverImageUrl ? (
        <ImageBackground
          imageStyle={styles.coverImage}
          resizeMode="cover"
          source={{ uri: series.coverImageUrl }}
          style={[styles.card, compact && styles.compactCard]}
        >
          <LinearGradient colors={["rgba(9,11,18,0.08)", "rgba(9,11,18,0.42)", "rgba(9,11,18,0.92)"]} style={styles.overlay}>
            {content}
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient colors={series.coverColor} style={[styles.card, compact && styles.compactCard]}>
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%"
  },
  card: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    width: "100%",
    aspectRatio: 0.74
  },
  compactCard: {
    aspectRatio: 0.72
  },
  coverImage: {
    borderRadius: theme.radius.lg,
    transform: [{ scale: 1.18 }]
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: theme.spacing.md
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 5
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
    fontSize: 22,
    fontWeight: "800"
  },
  compactTitle: {
    fontSize: 18,
    lineHeight: 24
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  tagText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 140
  },
  dot: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12
  }
});
