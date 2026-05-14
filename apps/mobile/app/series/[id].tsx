import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EpisodeRow } from "../../components/episode-row";
import { theme } from "../../constants/theme";
import { useResponsive } from "../../hooks/use-responsive";
import { useStory } from "../../hooks/use-story";
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
      <ScrollView contentContainerStyle={[styles.content, isTablet && { paddingHorizontal: hPad }]}>
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
          <Text style={styles.description}>{series.description}</Text>
        ) : null}

        <Modal
          animationType="fade"
          transparent
          visible={!!savedProgress && series.episodes.some((ep) => ep.id === savedProgress?.episodeId)}
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
              <Pressable
                style={styles.resumeSheetDismiss}
                onPress={() => setSavedProgress(null)}
              >
                <Text style={styles.resumeSheetDismissText}>Bỏ qua</Text>
              </Pressable>
              <Pressable
                style={styles.resumeSheetConfirm}
                onPress={() => {
                  setSavedProgress(null);
                  router.push({
                    pathname: "/player",
                    params: { seriesId: series.id, episodeId: savedProgress!.episodeId, resumeTime: String(Math.floor(savedProgress!.currentTime)) }
                  });
                }}
              >
                <Feather color="#11131C" name="play" size={16} />
                <Text style={styles.resumeSheetConfirmText}>Nghe tiếp</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

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
