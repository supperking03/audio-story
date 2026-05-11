import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Episode } from "../constants/mock-data";
import { theme } from "../constants/theme";

type EpisodeRowProps = {
  episode: Episode;
  highlighted?: boolean;
};

export function EpisodeRow({ episode, highlighted = false }: EpisodeRowProps) {
  return (
    <Pressable style={[styles.row, highlighted && styles.highlighted]}>
      <View style={styles.playIcon}>
        <Feather color={theme.colors.text} name="play" size={16} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{episode.title}</Text>
        <Text style={styles.meta}>
          {episode.durationLabel} • {episode.publishedAt}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: theme.spacing.md
  },
  highlighted: {
    backgroundColor: theme.colors.card
  },
  playIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  copy: {
    flex: 1,
    gap: 4
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  meta: {
    color: theme.colors.accentSoft,
    fontSize: 13,
    fontWeight: "600"
  }
});
