import { Feather } from "@expo/vector-icons";
import { useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingIndicator } from "../components/loading-indicator";
import { usePlayerMeta } from "../contexts/player-context";
import { theme } from "../constants/theme";
import { getFallbackNowPlaying } from "../data/story-service";
import { useResponsive } from "../hooks/use-responsive";
import { useSingletonPlayer } from "../hooks/use-singleton-player";
import { useStory } from "../hooks/use-story";
import { clearProgress, saveProgress } from "../lib/playback-store";

const speedOptions = ["0.8x", "1.0x", "1.1x", "1.2x", "1.3x", "1.5x", "2.0x"];


function formatClock(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) {
    return "00:00";
  }

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const nowPlaying = getFallbackNowPlaying();
  const { isTablet, hPad } = useResponsive();
  const params = useLocalSearchParams<{ episodeId?: string; seriesId?: string; resumeTime?: string }>();
  const resumeTime = params.resumeTime ? Number(params.resumeTime) : null;
  const hasResumedRef = useRef(false);
  const seriesId = params.seriesId ?? nowPlaying.seriesId;
  const { story: baseSeries, isLoading } = useStory(seriesId);
  const [selectedSpeed, setSelectedSpeed] = useState("1.2x");
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(params.episodeId ?? null);
  const [isEpisodeSwitching, setIsEpisodeSwitching] = useState(false);
  const { setMeta } = usePlayerMeta();

  useEffect(() => {
    setCurrentEpisodeId(params.episodeId ?? null);
  }, [params.episodeId]);

  const currentEpisode = useMemo(() => {
    if (currentEpisodeId) {
      return baseSeries?.episodes.find((episode) => episode.id === currentEpisodeId) ?? null;
    }

    return baseSeries?.episodes[0] ?? null;
  }, [baseSeries, currentEpisodeId]);

  const player = useSingletonPlayer(currentEpisode?.audioUrl ?? null, currentEpisode?.id ?? null);
  const status = useAudioPlayerStatus(player);
  const hasAudio = Boolean(currentEpisode?.audioUrl);

  useEffect(() => {
    if (!isEpisodeSwitching || !currentEpisode) {
      return;
    }

    const timer = setTimeout(() => {
      setIsEpisodeSwitching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [currentEpisode?.id, isEpisodeSwitching]);

  // Persist current episode meta for the mini player and lock screen (via AudioSessionManager)
  useEffect(() => {
    if (currentEpisode && baseSeries) {
      setMeta({
        episodeId: currentEpisode.id,
        episodeTitle: currentEpisode.title,
        seriesId: baseSeries.id,
        seriesTitle: baseSeries.title,
        coverColor: baseSeries.coverColor,
        coverImageUrl: baseSeries.coverImageUrl,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode?.id, baseSeries?.id]);

  useEffect(() => {
    player.setPlaybackRate(Number.parseFloat(selectedSpeed), "medium");
  }, [player, selectedSpeed]);

  // Seek to resume position once audio duration is known
  useEffect(() => {
    if (!resumeTime || hasResumedRef.current || status.duration <= 0) return;
    hasResumedRef.current = true;
    player.seekTo(resumeTime);
    player.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.duration > 0]);

  // Auto-save progress every 5 seconds while playing
  const saveTickRef = useRef(-1);
  useEffect(() => {
    if (!baseSeries || !currentEpisode || !status.playing) return;
    const tick = Math.floor(status.currentTime / 5);
    if (tick === saveTickRef.current) return;
    saveTickRef.current = tick;
    if (status.currentTime < 10) return;
    saveProgress(baseSeries.id, {
      episodeId: currentEpisode.id,
      episodeTitle: currentEpisode.title,
      currentTime: status.currentTime,
      savedAt: Date.now(),
    });
  }, [Math.floor(status.currentTime / 5), status.playing]);

  // Clear progress when episode finishes
  useEffect(() => {
    if (status.didJustFinish && baseSeries) {
      clearProgress(baseSeries.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const episodeIndex = baseSeries?.episodes.findIndex((episode) => episode.id === currentEpisode?.id) ?? -1;
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  const trackWidthRef = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  const playerRef = useRef(player);
  playerRef.current = player;
  const hasAudioRef = useRef(hasAudio);
  hasAudioRef.current = hasAudio;
  const isDraggingRef = useRef(false);
  const postSeekProgressRef = useRef<number | null>(null);

  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const animatedFillWidth = useMemo(
    () => animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
    [animatedProgress]
  );
  const animatedThumbLeft = useMemo(
    () => animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
    [animatedProgress]
  );
  const [dragDisplayTime, setDragDisplayTime] = useState<number | null>(null);

  // Runs synchronously after every committed render, before paint.
  // Keeps bar in sync with playback; postSeekProgressRef holds target position
  // after a seek until status.currentTime catches up (prevents snap-back).
  useLayoutEffect(() => {
    if (isDraggingRef.current) return;
    if (postSeekProgressRef.current !== null) {
      animatedProgress.setValue(postSeekProgressRef.current);
      if (Math.abs(progress - postSeekProgressRef.current) < 0.02) {
        postSeekProgressRef.current = null;
      }
      return;
    }
    animatedProgress.setValue(progress);
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => hasAudioRef.current && statusRef.current.duration > 0,
      onMoveShouldSetPanResponder: () => hasAudioRef.current && statusRef.current.duration > 0,
      onPanResponderGrant: (evt) => {
        isDraggingRef.current = true;
        if (statusRef.current.playing) playerRef.current.pause();
        const ratio = Math.min(Math.max(evt.nativeEvent.locationX / trackWidthRef.current, 0), 1);
        animatedProgress.setValue(ratio);
        setDragDisplayTime(ratio * statusRef.current.duration);
      },
      onPanResponderMove: (evt) => {
        const ratio = Math.min(Math.max(evt.nativeEvent.locationX / trackWidthRef.current, 0), 1);
        animatedProgress.setValue(ratio);
        setDragDisplayTime(ratio * statusRef.current.duration);
      },
      onPanResponderRelease: (evt) => {
        const ratio = Math.min(Math.max(evt.nativeEvent.locationX / trackWidthRef.current, 0), 1);
        isDraggingRef.current = false;
        postSeekProgressRef.current = ratio;
        setDragDisplayTime(null);
        playerRef.current.seekTo(ratio * statusRef.current.duration);
        playerRef.current.play();
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        postSeekProgressRef.current = null;
        setDragDisplayTime(null);
        playerRef.current.play();
      },
    })
  ).current;

  const changeEpisode = (direction: -1 | 1) => {
    if (!baseSeries || episodeIndex < 0) return;
    const nextEpisode = baseSeries.episodes[episodeIndex + direction];
    if (!nextEpisode) return;
    setIsEpisodeSwitching(true);
    setCurrentEpisodeId(nextEpisode.id);
  };

  const togglePlayback = async () => {
    if (!hasAudio) return;
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
      player.seekTo(0);
    }
    player.play();
  };

  const seekBy = (offsetSeconds: number) => {
    if (!hasAudio || status.duration <= 0) return;
    const nextTime = Math.min(Math.max(0, status.currentTime + offsetSeconds), status.duration);
    player.seekTo(nextTime);
  };

  const coverColors: [string, string] = baseSeries?.coverColor ?? ["#5C1A1B", "#E09F3E"];

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.content}>
          <LoadingIndicator centered label="Đang tải audio..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={[styles.content, isTablet && { paddingHorizontal: hPad }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather color={theme.colors.text} name="arrow-left" size={18} />
          </Pressable>
          <Text numberOfLines={1} style={styles.headerTitle}>
            Đang phát
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <LinearGradient colors={coverColors} style={[styles.coverArt, isTablet && styles.coverArtTablet]}>
          {isEpisodeSwitching ? (
            <View style={styles.episodeSwitchingBadge}>
              <ActivityIndicator color="#FFFFFF" size="small" />
            </View>
          ) : null}
          <Text style={styles.coverTitle}>{baseSeries?.title ?? nowPlaying.title}</Text>
          <Text style={styles.coverEpisode}>{currentEpisode?.title ?? nowPlaying.episodeTitle}</Text>
        </LinearGradient>

        <View style={styles.metaSection}>
          <Text style={styles.storyEpisode}>
            {currentEpisode?.durationLabel ?? "Chưa rõ"} • {selectedSpeed}
          </Text>
          {!hasAudio ? <Text style={styles.helperText}>Tập này chưa có file audio thật.</Text> : null}
        </View>

        <View style={styles.timeline}>
          <View
            style={styles.timelineWrapper}
            onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
            {...panResponder.panHandlers}
          >
            <View style={styles.timelineTrack}>
              <Animated.View style={[styles.timelineFill, { width: animatedFillWidth }]} />
            </View>
            <Animated.View style={[styles.timelineThumb, { left: animatedThumbLeft }]} />
          </View>
          <View style={styles.timelineLabels}>
            <Text style={styles.timelineText}>{formatClock(dragDisplayTime ?? status.currentTime)}</Text>
            <Text style={styles.timelineText}>{formatClock(status.duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <ControlButton disabled={!hasAudio} icon="rotate-ccw" label="15s" onPress={() => seekBy(-15)} />
          <ControlButton disabled={!baseSeries || episodeIndex >= baseSeries.episodes.length - 1} icon="skip-back" label="" onPress={() => changeEpisode(1)} />
          <Pressable
            disabled={!hasAudio}
            onPress={togglePlayback}
            style={[styles.primaryButton, isTablet && styles.primaryButtonTablet, !hasAudio && styles.disabledButton]}
          >
            <Feather color="#11131C" name={status.playing ? "pause" : "play"} size={26} />
          </Pressable>
          <ControlButton disabled={!baseSeries || episodeIndex <= 0} icon="skip-forward" label="" onPress={() => changeEpisode(-1)} />
          <ControlButton disabled={!hasAudio} icon="rotate-cw" label="30s" onPress={() => seekBy(30)} />
        </View>

        <View style={styles.speedRow}>
          {speedOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSelectedSpeed(option)}
              style={[styles.speedChip, option === selectedSpeed && styles.speedChipActive]}
            >
              <Text style={[styles.speedText, option === selectedSpeed && styles.speedTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.utilityRow}>
          <UtilityTile
            label="Danh sách tập"
            value={`${baseSeries?.episodes.length ?? 0}`}
            onPress={baseSeries ? () => setShowEpisodes(true) : undefined}
          />
          <UtilityTile
            label="Nội dung"
            value={currentEpisode?.transcriptText ? "Xem" : "—"}
            onPress={currentEpisode?.transcriptText ? () => setShowTranscript(true) : undefined}
          />
        </View>

        <Modal animationType="slide" transparent visible={showTranscript} onRequestClose={() => setShowTranscript(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowTranscript(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{currentEpisode?.title ?? "Nội dung"}</Text>
            <ScrollView contentContainerStyle={styles.transcriptContent}>
              <Text style={styles.transcriptText}>{currentEpisode?.transcriptText}</Text>
            </ScrollView>
          </View>
        </Modal>

        <Modal animationType="slide" transparent visible={showEpisodes} onRequestClose={() => setShowEpisodes(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEpisodes(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Danh sách tập</Text>
            <FlatList
              data={baseSeries?.episodes ?? []}
              keyExtractor={(ep) => ep.id}
              contentContainerStyle={styles.sheetList}
              renderItem={({ item: ep }) => {
                const isCurrent = ep.id === currentEpisode?.id;
                return (
                  <Pressable
                    style={[styles.sheetRow, isCurrent && styles.sheetRowActive]}
                    onPress={() => {
                      setShowEpisodes(false);
                      setIsEpisodeSwitching(true);
                      setCurrentEpisodeId(ep.id);
                    }}
                  >
                    <View style={[styles.sheetPlayIcon, isCurrent && styles.sheetPlayIconActive]}>
                      <Feather color={isCurrent ? "#11131C" : theme.colors.text} name={isCurrent && status.playing ? "pause" : "play"} size={14} />
                    </View>
                    <View style={styles.sheetCopy}>
                      <Text style={[styles.sheetEpTitle, isCurrent && styles.sheetEpTitleActive]}>{ep.title}</Text>
                      <Text style={[styles.sheetEpMeta, isCurrent && styles.sheetEpMetaActive]}>{ep.durationLabel} • {ep.publishedAt}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function ControlButton({
  disabled = false,
  icon,
  label,
  onPress
}: {
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.controlButton, disabled && styles.disabledButton]}>
      <Feather color={theme.colors.text} name={icon} size={22} />
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

function UtilityTile({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.utilityTile, !!onPress && styles.utilityTileTappable]}>
      <Text style={styles.utilityLabel}>{label}</Text>
      <View style={styles.utilityValueRow}>
        <Text style={styles.utilityValue}>{value}</Text>
        {onPress ? <Feather color={theme.colors.textMuted} name="chevron-right" size={16} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  content: {
    flex: 1,
    gap: theme.spacing.xl,
    padding: theme.spacing.lg
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
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
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center"
  },
  headerSpacer: {
    width: 40
  },
  coverArt: {
    borderRadius: 32,
    gap: 6,
    justifyContent: "flex-end",
    minHeight: 280,
    padding: 24
  },
  coverArtTablet: {
    minHeight: 400
  },
  coverTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800"
  },
  coverEpisode: {
    color: "#FFF3D1",
    fontSize: 14
  },
  episodeSwitchingBadge: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: theme.radius.pill,
    height: 34,
    justifyContent: "center",
    marginBottom: "auto",
    width: 34
  },
  metaSection: {
    gap: 6
  },
  storyEpisode: {
    color: theme.colors.textMuted,
    fontSize: 14
  },
  helperText: {
    color: theme.colors.warning,
    fontSize: 13,
    fontWeight: "600"
  },
  timeline: {
    gap: 10
  },
  timelineWrapper: {
    height: 22,
    justifyContent: "center",
    position: "relative"
  },
  timelineTrack: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    height: 8,
    overflow: "hidden"
  },
  timelineFill: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    height: "100%"
  },
  timelineThumb: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    height: 18,
    marginLeft: -9,
    position: "absolute",
    top: 2,
    width: 18
  },
  timelineLabels: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  timelineText: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  controlButton: {
    alignItems: "center",
    gap: 2,
    minWidth: 36
  },
  controlLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  primaryButtonTablet: {
    height: 90,
    width: 90
  },
  disabledButton: {
    opacity: 0.45
  },
  speedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  speedChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  speedChipActive: {
    backgroundColor: theme.colors.accent
  },
  speedText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  speedTextActive: {
    color: "#11131C"
  },
  utilityRow: {
    flexDirection: "row",
    gap: 12
  },
  utilityTile: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: theme.spacing.md
  },
  utilityLabel: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  utilityValueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  utilityValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  utilityTileTappable: {
    borderColor: theme.colors.accent
  },
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    maxHeight: "70%",
    paddingBottom: 32,
    paddingTop: 12
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    height: 4,
    marginBottom: 16,
    width: 40
  },
  sheetTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: theme.spacing.lg
  },
  sheetList: {
    gap: 8,
    paddingHorizontal: theme.spacing.lg
  },
  sheetRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 12,
    padding: theme.spacing.md
  },
  sheetRowActive: {
    backgroundColor: theme.colors.accent
  },
  sheetPlayIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  sheetPlayIconActive: {
    backgroundColor: "rgba(0,0,0,0.2)"
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
  sheetEpTitleActive: {
    color: "#11131C"
  },
  sheetEpMeta: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  sheetEpMetaActive: {
    color: "rgba(17, 19, 28, 0.6)"
  },
  transcriptContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 32
  },
  transcriptText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 26
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: "600"
  }
});
