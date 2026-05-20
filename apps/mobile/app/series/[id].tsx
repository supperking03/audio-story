import { Feather } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingIndicator } from "../../components/loading-indicator";
import { RequestStoryCard } from "../../components/request-story-card";
import { theme } from "../../constants/theme";
import { useResponsive } from "../../hooks/use-responsive";
import { useStory } from "../../hooks/use-story";
import { loadStoryEpisodes, type Episode } from "../../data/story-service";
import { type SavedProgress, loadProgress } from "../../lib/playback-store";

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SeriesDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { story: series, isLoading, error } = useStory(params.id);
  const { isTablet, hPad } = useResponsive();
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
  const [isLoadingMoreEpisodes, setIsLoadingMoreEpisodes] = useState(false);
  const isLoadingMoreEpisodesRef = useRef(false);
  const episodeSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (!params.id) return;
    loadStoryEpisodes(params.id, 0, 50).then(({ episodes: eps, total }) => {
      setEpisodes(eps);
      setTotalEpisodes(total);
    }).catch(() => {}).finally(() => setIsLoadingEpisodes(false));
  }, [params.id]);

  const loadMoreEpisodes = useCallback(() => {
    if (!params.id || isLoadingMoreEpisodesRef.current || episodes.length >= totalEpisodes) return;
    isLoadingMoreEpisodesRef.current = true;
    setIsLoadingMoreEpisodes(true);
    loadStoryEpisodes(params.id, episodes.length, 50)
      .then(({ episodes: more }) => {
        setEpisodes((prev) => [...prev, ...more]);
      })
      .catch(() => {})
      .finally(() => {
        isLoadingMoreEpisodesRef.current = false;
        setIsLoadingMoreEpisodes(false);
      });
  }, [params.id, episodes.length, totalEpisodes]);

  useEffect(() => {
    if (!params.id) return;
    loadProgress(params.id).then((p) => {
      if (p && p.currentTime > 10) setSavedProgress(p);
    });
  }, [params.id]);

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.missingState}>
          <LoadingIndicator centered label="Đang tải series..." />
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

  const firstEpisode = episodes[0] ?? series?.episodes[0];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <Modal
        animationType="fade"
        transparent
        visible={!!savedProgress && episodes.some((ep) => ep.id === savedProgress?.episodeId)}
        onRequestClose={() => setSavedProgress(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSavedProgress(null)} />
        <View style={styles.resumeSheet}>
          <View style={styles.resumeSheetHandle} />
          <Text style={styles.resumeSheetTitle}>Nghe tiếp?</Text>
          <Text style={styles.resumeSheetBody} numberOfLines={2}>
            Lần trước bạn đang nghe{"\n"}
            <Text style={styles.resumeSheetHighlight}>
              {savedProgress?.episodeTitle} • {formatClock(savedProgress?.currentTime ?? 0)}
            </Text>
          </Text>
          <View style={styles.resumeSheetActions}>
            <Pressable style={styles.resumeSheetDismiss} onPress={() => setSavedProgress(null)}>
              <Text style={styles.resumeSheetDismissText}>Bỏ qua</Text>
            </Pressable>
            <Pressable
              style={styles.resumeSheetConfirm}
              onPress={() => {
                setSavedProgress(null);
                router.push({ pathname: "/player", params: { seriesId: series.id, episodeId: savedProgress!.episodeId, resumeTime: String(Math.floor(savedProgress!.currentTime)) } });
              }}
            >
              <Feather color="#11131C" name="play" size={16} />
              <Text style={styles.resumeSheetConfirmText}>Nghe tiếp</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={[styles.content, isTablet && { paddingHorizontal: hPad }]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather color={theme.colors.text} name="arrow-left" size={18} />
          </Pressable>
          <Text style={styles.headerTitle}>Chi tiết</Text>
        </View>

        <LinearGradient colors={series.coverColor} style={[styles.hero, isTablet && styles.heroTablet]}>
          <Text style={styles.heroMood}>{series.mood}</Text>
          <Text style={styles.heroTitle}>{series.title}</Text>
          <Text style={styles.heroMeta}>
            {series.author} • {series.tags.join(" • ")}
          </Text>
        </LinearGradient>

        {series.description ? (
          <View style={styles.descriptionBlock}>
            <Text numberOfLines={isDescriptionExpanded ? undefined : 4} style={styles.description}>
              {series.description}
            </Text>
            {series.description.length > 140 ? (
              <Pressable onPress={() => setIsDescriptionExpanded((v) => !v)} style={styles.expandButton}>
                <Text style={styles.expandButtonText}>{isDescriptionExpanded ? "Thu gọn" : "Xem thêm"}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actionRow}>
          {firstEpisode ? (
            <Pressable
              onPress={() => router.push({ pathname: "/player", params: { seriesId: series.id, episodeId: firstEpisode.id } })}
              style={styles.primaryAction}
            >
              <Feather color="#11131C" name="play" size={18} />
              <Text style={styles.primaryActionText}>Nghe từ đầu</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => episodeSheetRef.current?.present()}
            style={styles.episodeListButton}
          >
            <Feather color={theme.colors.text} name="list" size={18} />
            <Text style={styles.episodeListButtonText}>
              {isLoadingEpisodes ? "Đang tải tập..." : totalEpisodes > 0 ? `${totalEpisodes} tập` : "Danh sách tập"}
            </Text>
            {isLoadingEpisodes
              ? <ActivityIndicator color={theme.colors.textMuted} size="small" />
              : <Feather color={theme.colors.textMuted} name="chevron-right" size={16} style={styles.episodeListChevron} />}
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheetModal
        ref={episodeSheetRef}
        snapPoints={["75%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandleIndicator}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Danh sách tập</Text>
          {totalEpisodes > 0 ? <Text style={styles.sheetEpisodeCount}>{totalEpisodes} tập</Text> : null}
        </View>
        <BottomSheetFlatList
          data={episodes}
          keyExtractor={(ep) => ep.id}
          contentContainerStyle={styles.sheetList}
          onEndReached={loadMoreEpisodes}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            isLoadingEpisodes ? (
              <ActivityIndicator color={theme.colors.accent} size="small" style={styles.loadingMore} />
            ) : null
          }
          ListFooterComponent={
            isLoadingMoreEpisodes ? (
              <ActivityIndicator color={theme.colors.accent} size="small" style={styles.loadingMore} />
            ) : episodes.length >= totalEpisodes && totalEpisodes > 0 ? (
              <View style={styles.episodeListFooter}>
                <RequestStoryCard
                  autoSubmit
                  suggestedTitle={series.title}
                  title="Muốn thêm tập mới?"
                  body="Nhấn để yêu cầu admin bổ sung tập tiếp theo."
                />
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item: episode, index }) => (
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                episodeSheetRef.current?.dismiss();
                router.push({ pathname: "/player", params: { seriesId: series.id, episodeId: episode.id } });
              }}
            >
              <View style={styles.sheetEpNumber}>
                <Text style={styles.sheetEpNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.sheetCopy}>
                <Text style={styles.sheetEpTitle} numberOfLines={2}>{episode.title}</Text>
                <Text style={styles.sheetEpMeta}>{episode.durationLabel} • {episode.publishedAt}</Text>
              </View>
              <Feather color={theme.colors.textMuted} name="chevron-right" size={16} />
            </Pressable>
          )}
        />
      </BottomSheetModal>
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
    paddingBottom: 48
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
  heroTablet: {
    minHeight: 360
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
  description: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  descriptionBlock: {
    gap: 10
  },
  expandButton: {
    alignSelf: "flex-start"
  },
  expandButtonText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "700"
  },
  actionRow: {
    gap: 12
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
  episodeListButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 16
  },
  episodeListButtonText: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  episodeListChevron: {
    marginLeft: "auto"
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)"
  },
  resumeSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    bottom: 0,
    gap: theme.spacing.md,
    left: 0,
    padding: theme.spacing.lg,
    paddingBottom: 40,
    position: "absolute",
    right: 0
  },
  resumeSheetHandle: {
    alignSelf: "center",
    backgroundColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    height: 4,
    marginBottom: 4,
    width: 40
  },
  resumeSheetTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  resumeSheetBody: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  resumeSheetHighlight: {
    color: theme.colors.text,
    fontWeight: "700"
  },
  resumeSheetActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4
  },
  resumeSheetDismiss: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    flex: 1,
    paddingVertical: 14
  },
  resumeSheetDismissText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  resumeSheetConfirm: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    flex: 2,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14
  },
  resumeSheetConfirmText: {
    color: "#11131C",
    fontSize: 15,
    fontWeight: "800"
  },
  sheetBackground: {
    backgroundColor: theme.colors.surface
  },
  sheetHandleIndicator: {
    backgroundColor: theme.colors.line,
    width: 40
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: theme.spacing.lg
  },
  sheetTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  sheetEpisodeCount: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  sheetList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 32
  },
  sheetRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12
  },
  sheetEpNumber: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  sheetEpNumberText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  sheetCopy: {
    flex: 1,
    gap: 3
  },
  sheetEpTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  sheetEpMeta: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  separator: {
    backgroundColor: theme.colors.line,
    height: StyleSheet.hairlineWidth
  },
  loadingMore: {
    alignSelf: "center",
    paddingVertical: 16
  },
  episodeListFooter: {
    paddingTop: 8,
    paddingBottom: 16
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
