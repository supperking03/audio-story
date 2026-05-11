import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EpisodeRow } from "../../components/episode-row";
import { SectionHeader } from "../../components/section-header";
import { StoryCard } from "../../components/story-card";
import { browseTerms, continueListening, featuredSeries } from "../../constants/mock-data";
import { theme } from "../../constants/theme";

export default function HomeScreen() {
  const primarySeries = featuredSeries[0];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroHeader}>
          <Text style={styles.kicker}>Audio Story</Text>
          <Text style={styles.title}>Discover</Text>
        </View>

        <View style={styles.searchSection}>
          <SectionHeader title="Browse" />
          <Pressable onPress={() => router.push("/search")} style={styles.searchBox}>
            <Feather color={theme.colors.textMuted} name="search" size={18} />
            <Text style={styles.placeholder}>Tên truyện, tác giả, mood...</Text>
          </Pressable>
          <View style={styles.filterRow}>
            {browseTerms.map((term) => (
              <Pressable
                key={term}
                onPress={() => router.push({ pathname: "/search", params: { query: term } })}
                style={styles.filterChip}
              >
                <Text style={styles.filterText}>{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <LinearGradient colors={["#241023", "#4A1942", "#893168"]} style={styles.resumeCard}>
          <Text style={styles.resumeLabel}>Tiếp tục nghe</Text>
          <Text style={styles.resumeTitle}>{continueListening.title}</Text>
          <Text style={styles.resumeEpisode}>{continueListening.episodeTitle}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${continueListening.progress * 100}%` }]} />
          </View>
          <Text style={styles.resumeMeta}>{continueListening.remainingLabel}</Text>
        </LinearGradient>

        <View style={styles.section}>
          <SectionHeader title="Mới cập nhật" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.horizontalList}>
              {featuredSeries.map((series) => (
                <StoryCard key={series.id} series={series} />
              ))}
            </View>
          </ScrollView>
        </View>
        <View style={styles.section}>
          <SectionHeader title="Up next" />
          <View style={styles.episodeList}>
            {primarySeries.episodes.map((episode, index) => (
              <EpisodeRow key={episode.id} episode={episode} highlighted={index === 0} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  content: {
    gap: theme.spacing.xl,
    padding: theme.spacing.lg,
    paddingBottom: 140
  },
  heroHeader: {
    gap: 10,
    marginTop: 8
  },
  searchSection: {
    gap: 14
  },
  kicker: {
    color: theme.colors.accentSoft,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 42
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  placeholder: {
    color: theme.colors.textMuted,
    flex: 1,
    fontSize: 15
  },
  filterChip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  filterText: {
    color: theme.colors.accentSoft,
    fontSize: 13,
    fontWeight: "700"
  },
  resumeCard: {
    borderRadius: theme.radius.lg,
    gap: 8,
    padding: theme.spacing.lg
  },
  resumeLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  resumeTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800"
  },
  resumeEpisode: {
    color: "#F9D7EA",
    fontSize: 14
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: theme.radius.pill,
    height: 8,
    marginTop: 10,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    height: "100%"
  },
  resumeMeta: {
    color: "#FFE7A8",
    fontSize: 13,
    fontWeight: "600"
  },
  section: {
    gap: 14
  },
  horizontalList: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  episodeList: {
    gap: 12
  }
});
