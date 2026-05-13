import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EpisodeRow } from "../components/episode-row";
import { SectionHeader } from "../components/section-header";
import { StoryCard } from "../components/story-card";
import { browseTerms } from "../constants/mock-data";
import { theme } from "../constants/theme";
import { searchSeries } from "../data/story-service";
import { useStories } from "../hooks/use-stories";

export default function SearchScreen() {
  const params = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(params.query ?? "");
  const { stories, isLoading, error } = useStories();

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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather color={theme.colors.text} name="arrow-left" size={18} />
          </Pressable>
          <Text style={styles.title}>Search</Text>
        </View>

        <View style={styles.searchBox}>
          <Feather color={theme.colors.textMuted} name="search" size={18} />
          <TextInput
            autoFocus
            onChangeText={setQuery}
            placeholder="Tên truyện, tác giả, mood..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={query}
          />
        </View>

        <View style={styles.chips}>
          {browseTerms.map((term) => (
            <Pressable key={term} onPress={() => setQuery(term)} style={styles.chip}>
              <Text style={styles.chipText}>{term}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title={query ? `${results.length} kết quả` : "Gợi ý cho bạn"} />
          {isLoading ? <Text style={styles.helperText}>Đang tải truyện...</Text> : null}
          {error ? <Text style={styles.errorText}>Lỗi API: {error}</Text> : null}
          <View style={styles.resultList}>
            {results.map((series) => (
              <StoryCard key={series.id} compact onPress={() => openSeries(series.id)} series={series} />
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

        {query && results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Không thấy kết quả phù hợp</Text>
            <Text style={styles.emptyText}>Thử đổi mood hoặc tìm theo tên tác giả.</Text>
          </View>
        ) : null}
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
  resultList: {
    gap: 14
  },
  episodeList: {
    gap: 12
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 6,
    padding: theme.spacing.lg
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14
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
