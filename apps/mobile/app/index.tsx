import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SectionHeader } from "../components/section-header";
import { StoryCard } from "../components/story-card";
import { browseTerms } from "../constants/mock-data";
import { theme } from "../constants/theme";
import { useResponsive } from "../hooks/use-responsive";
import { useStories } from "../hooks/use-stories";

export default function HomeScreen() {
  const { stories, isLoading, error } = useStories();
  const { isTablet, hPad } = useResponsive();

  const openSeries = (seriesId: string) => {
    router.push({ pathname: "/series/[id]", params: { id: seriesId } });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}>
        <View style={styles.heroHeader}>
          <Text style={styles.appName}>BuBu</Text>
          <Text style={styles.appSub}>Nghe truyện ngôn tình & trinh thám</Text>
        </View>

        <View style={styles.searchSection}>
          <Pressable onPress={() => router.push("/search")} style={styles.searchBox}>
            <Feather color={theme.colors.textMuted} name="search" size={18} />
            <Text style={styles.placeholder}>Tên truyện, tác giả, mood...</Text>
          </Pressable>
          <View style={styles.filterRow}>
            {browseTerms.slice(0, 5).map((term) => (
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

        <View style={styles.section}>
          <SectionHeader title="Tất cả truyện" />
          {isLoading ? <Text style={styles.helperText}>Đang tải danh sách truyện...</Text> : null}
          {error ? <Text style={styles.errorText}>Lỗi API: {error}</Text> : null}
          {!isLoading && !error && stories.length === 0 ? (
            <Text style={styles.helperText}>API đang chạy nhưng chưa có truyện nào.</Text>
          ) : null}
          <View style={[styles.storyList, isTablet && styles.storyListTablet]}>
            {stories.map((series) => (
              <View key={series.id} style={isTablet ? styles.storyGridItem : null}>
                <StoryCard compact onPress={() => openSeries(series.id)} series={series} />
              </View>
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
  storyListTablet: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  storyGridItem: {
    width: "49%"
  },
  heroHeader: {
    gap: 4,
    marginTop: 8
  },
  appName: {
    color: theme.colors.accent,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 46
  },
  appSub: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 2
  },
  searchSection: {
    gap: 14
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
  section: {
    gap: 14
  },
  storyList: {
    gap: theme.spacing.md,
    width: "100%"
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
