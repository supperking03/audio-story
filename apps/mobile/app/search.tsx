import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EpisodeRow } from "../components/episode-row";
import { LoadingIndicator } from "../components/loading-indicator";
import { RequestStoryCard } from "../components/request-story-card";
import { SectionHeader } from "../components/section-header";
import { StoryCard } from "../components/story-card";
import { theme } from "../constants/theme";
import { searchSeries } from "../data/story-service";
import { useResponsive } from "../hooks/use-responsive";
import { useStories } from "../hooks/use-stories";

export default function SearchScreen() {
  const params = useLocalSearchParams<{ query?: string }>();
  const initialQuery = params.query ?? "";
  const [query, setQuery] = useState(initialQuery);
  const { stories, isLoading, error } = useStories();
  const { isTablet, hPad } = useResponsive();
  const filterTags = useMemo(() => {
    const counts = new Map<string, number>();

    for (const story of stories) {
      for (const tag of story.tags) {
        const normalized = tag.trim();
        if (!normalized) {
          continue;
        }
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => {
        const countDiff = b[1] - a[1];
        if (countDiff !== 0) {
          return countDiff;
        }
        return a[0].localeCompare(b[0], "vi");
      })
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [stories]);

  const results = useMemo(() => searchSeries(stories, query), [query, stories]);
  const episodeResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return results.flatMap((series) =>
      series.episodes
        .filter((episode) => episode.title.toLowerCase().includes(normalized))
        .slice(0, 2)
    );
  }, [query, results]);

  const openSeries = (seriesId: string) => {
    router.push({ pathname: "/series/[id]", params: { id: seriesId } });
  };

  const openEpisode = (seriesId: string, episodeId: string) => {
    router.push({ pathname: "/player", params: { seriesId, episodeId } });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[styles.content, isTablet && { paddingHorizontal: hPad }]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Feather color={theme.colors.text} name="arrow-left" size={18} />
            </Pressable>
            <Text style={styles.title}>Tìm kiếm</Text>
          </View>

          <View style={styles.searchBox}>
            <Feather color={theme.colors.textMuted} name="search" size={18} />
            <TextInput
              autoFocus={!initialQuery.trim()}
              onChangeText={setQuery}
              placeholder="Tên truyện, tác giả, mood..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={query}
            />
          </View>

          <View style={styles.chips}>
            {filterTags.map((term) => (
              <Pressable key={term} onPress={() => setQuery(term)} style={styles.chip}>
                <Text style={styles.chipText}>{term}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader title={query ? `${results.length} kết quả` : "Gợi ý cho bạn"} />
            {isLoading ? <LoadingIndicator label="Đang tải truyện..." /> : null}
            {error ? <Text style={styles.errorText}>Lỗi API: {error}</Text> : null}
            <View style={styles.storyList}>
              {results.map((series) => (
                <View
                  key={series.id}
                  style={[
                    styles.storyGridItem,
                    isTablet ? styles.storyGridItemTablet : styles.storyGridItemPhone,
                  ]}
                >
                  <StoryCard compact onPress={() => openSeries(series.id)} promotedTags={filterTags} series={series} />
                </View>
              ))}
            </View>
          </View>

          {episodeResults.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Tập liên quan" />
              <View style={styles.episodeList}>
                {episodeResults.map((episode) => (
                  <EpisodeRow
                    key={episode.id}
                    episode={episode}
                    onPress={() => {
                      const parentSeries = results.find((series) =>
                        series.episodes.some((seriesEpisode) => seriesEpisode.id === episode.id)
                      );
                      if (parentSeries) {
                        openEpisode(parentSeries.id, episode.id);
                      }
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <RequestStoryCard
            suggestedTitle={query.trim()}
            title={query.trim() ? "Không thấy đúng truyện này?" : "Muốn nghe thêm truyện mới?"}
            body={query.trim() ? "Gửi luôn tên truyện bạn đang tìm." : "Gửi tên truyện để mình bổ sung sau."}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  keyboardContainer: {
    flex: 1,
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
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800"
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
  input: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  chip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipText: {
    color: theme.colors.accentSoft,
    fontSize: 13,
    fontWeight: "700"
  },
  section: {
    gap: 14
  },
  storyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%"
  },
  storyGridItem: {
    marginBottom: 2
  },
  storyGridItemPhone: {
    width: "48%"
  },
  storyGridItemTablet: {
    width: "31.8%"
  },
  episodeList: {
    gap: 12
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 14
  },
  errorText: {
    color: theme.colors.warning,
    fontSize: 13,
    lineHeight: 19
  }
});
