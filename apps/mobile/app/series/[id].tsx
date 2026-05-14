import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EpisodeRow } from "../../components/episode-row";
import { theme } from "../../constants/theme";
import { useStory } from "../../hooks/use-story";

export default function SeriesDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { story: series, isLoading, error } = useStory(params.id);

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.missingState}>
          <Text style={styles.loadingText}>Đang tải series...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!series) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>{error ? "Không tải được truyện" : "Không tìm thấy truyện"}</Text>
          {error ? <Text style={styles.loadingText}>Lỗi API: {error}</Text> : null}
          <Pressable onPress={() => router.back()} style={styles.backInline}>
            <Text style={styles.backInlineText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const latestEpisode = series.episodes[0];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather color={theme.colors.text} name="arrow-left" size={18} />
          </Pressable>
          <Text style={styles.headerTitle}>Series</Text>
        </View>

        <LinearGradient colors={series.coverColor} style={styles.hero}>
          <Text style={styles.heroMood}>{series.mood}</Text>
          <Text style={styles.heroTitle}>{series.title}</Text>
          <Text style={styles.heroMeta}>
            {series.author} • {series.tags.join(" • ")}
          </Text>
        </LinearGradient>

        {series.description ? (
          <Text style={styles.description}>{series.description}</Text>
        ) : null}

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/player",
              params: { seriesId: series.id, episodeId: latestEpisode.id }
            })
          }
          style={styles.primaryAction}
        >
          <Feather color="#11131C" name="play" size={18} />
          <Text style={styles.primaryActionText}>Nghe từ tập mới nhất</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tất cả tập</Text>
          <View style={styles.episodeList}>
            {series.episodes.map((episode, index) => (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                highlighted={index === 0}
                onPress={() =>
                  router.push({
                    pathname: "/player",
                    params: { seriesId: series.id, episodeId: episode.id }
                  })
                }
              />
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
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: 120
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  backButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800"
  },
  hero: {
    borderRadius: theme.radius.lg,
    gap: 8,
    minHeight: 240,
    justifyContent: "flex-end",
    padding: theme.spacing.lg
  },
  heroMood: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800"
  },
  heroMeta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  primaryActionText: {
    color: "#11131C",
    fontSize: 15,
    fontWeight: "800"
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700"
  },
  episodeList: {
    gap: 12
  },
  missingState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg
  },
  missingTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700"
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: "600"
  },
  backInline: {
    marginTop: 12
  },
  backInlineText: {
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: "700"
  }
});
