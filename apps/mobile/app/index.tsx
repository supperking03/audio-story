import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingIndicator } from "../components/loading-indicator";
import { NotificationSettingsSheet } from "../components/notification-settings-sheet";
import { RequestStoryCard } from "../components/request-story-card";
import { SectionHeader } from "../components/section-header";
import { StoryCard } from "../components/story-card";
import { theme } from "../constants/theme";
import { type StorySeries } from "../data/story-service";
import { useResponsive } from "../hooks/use-responsive";
import { useStories } from "../hooks/use-stories";

export default function HomeScreen() {
  const { stories, total, isLoading, isRefreshing, isLoadingMore, error, refresh, loadMore } = useStories();
  const { isTablet, hPad } = useResponsive();
  const [showNotifSettings, setShowNotifSettings] = useState(false);
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

  const openSeries = (seriesId: string) => {
    router.push({ pathname: "/series/[id]", params: { id: seriesId } });
  };

  const ListHeader = (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={styles.heroHeaderRow}>
        <View style={styles.heroHeader}>
          <Text style={styles.appName}>BuBu</Text>
          <Text style={styles.appSub}>Nghe truyện ngôn tình & trinh thám</Text>
        </View>
        <View style={styles.headerButtons}>
          {Platform.OS === "ios" ? (
            <Pressable onPress={() => setShowNotifSettings(true)} style={styles.headerIconButton}>
              <Feather color={theme.colors.text} name="bell" size={18} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.push("/history" as never)} style={styles.headerIconButton}>
            <Feather color={theme.colors.text} name="clock" size={18} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchSection}>
        <Pressable onPress={() => router.push("/search")} style={styles.searchBox}>
          <Feather color={theme.colors.textMuted} name="search" size={18} />
          <Text style={styles.placeholder}>Tên truyện, tác giả, mood...</Text>
        </Pressable>
        <View style={styles.filterRow}>
          {filterTags.map((term) => (
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

      <SectionHeader title="Tất cả truyện" />
      {isLoading ? <LoadingIndicator label="Đang tải danh sách truyện..." /> : null}
      {error ? <Text style={styles.errorText}>Lỗi API: {error}</Text> : null}
      {!isLoading && !error && stories.length === 0 ? (
        <Text style={styles.helperText}>API đang chạy nhưng chưa có truyện nào.</Text>
      ) : null}
    </View>
  );

  const ListFooter = (
    <View style={styles.footerSection}>
      {isLoadingMore ? (
        <ActivityIndicator color={theme.colors.accent} size="small" style={styles.loadingMoreIndicator} />
      ) : null}
      <RequestStoryCard />
    </View>
  );

  const renderItem = ({ item: series }: { item: StorySeries }) => (
    <View
      style={[
        styles.storyGridItem,
        isTablet ? styles.storyGridItemTablet : styles.storyGridItemPhone,
      ]}
    >
      <StoryCard compact onPress={() => openSeries(series.id)} promotedTags={filterTags} series={series} />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <NotificationSettingsSheet visible={showNotifSettings} onClose={() => setShowNotifSettings(false)} />
      <FlatList
        data={isLoading ? [] : stories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={isTablet ? 3 : 2}
        key={isTablet ? "tablet" : "phone"}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}
        ListHeaderComponent={ListHeader}
        ListHeaderComponentStyle={styles.listHeader}
        ListFooterComponent={ListFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
            refreshing={isRefreshing}
            tintColor={theme.colors.accent}
          />
        }
      />
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
    padding: theme.spacing.md,
    paddingBottom: 140
  },
  listHeader: {
    marginBottom: theme.spacing.md
  },
  heroHeader: {
    gap: 4,
    marginTop: 4
  },
  heroHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  headerIconButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
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
    gap: 12
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
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  filterText: {
    color: theme.colors.accentSoft,
    fontSize: 12,
    fontWeight: "700"
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  totalLabel: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  columnWrapper: {
    gap: 12
  },
  storyGridItem: {
    flex: 1,
    marginBottom: 2
  },
  storyGridItemPhone: {
    maxWidth: "50%"
  },
  storyGridItemTablet: {
    maxWidth: "33.333%"
  },
  footerSection: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md
  },
  loadingMoreIndicator: {
    alignSelf: "center",
    paddingVertical: 8
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
