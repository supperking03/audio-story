import { Feather } from "@expo/vector-icons";
import { useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingIndicator } from "../components/loading-indicator";
import { usePlayerMeta } from "../contexts/player-context";
import { theme } from "../constants/theme";
import { getFallbackNowPlaying, loadEpisodeById, type Episode } from "../data/story-service";
import { useResponsive } from "../hooks/use-responsive";
import { useSingletonPlayer } from "../hooks/use-singleton-player";
import { useStory } from "../hooks/use-story";
import { clearProgress, saveProgress } from "../lib/playback-store";

const MIN_SPEED = 0.5;
const MAX_SPEED = 2.5;
const SPEED_STEP = 0.1;

const SLEEP_TIMER_OPTIONS = [
  { key: "off", label: "Tắt", shortLabel: "Tắt" },
  { key: "10m", label: "10 phút", minutes: 10, shortLabel: "10p" },
  { key: "15m", label: "15 phút", minutes: 15, shortLabel: "15p" },
  { key: "20m", label: "20 phút", minutes: 20, shortLabel: "20p" },
  { key: "30m", label: "30 phút", minutes: 30, shortLabel: "30p" },
  { key: "45m", label: "45 phút", minutes: 45, shortLabel: "45p" },
  { key: "60m", label: "1 giờ", minutes: 60, shortLabel: "1h" },
  { key: "episode", label: "Hết tập hiện tại", shortLabel: "Hết tập" },
] as const;

type SleepTimerOptionKey = typeof SLEEP_TIMER_OPTIONS[number]["key"];
type SleepTimerOption = typeof SLEEP_TIMER_OPTIONS[number];


function formatClock(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) {
    return "00:00";
  }

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snapSpeed(value: number) {
  const snapped = Math.round(value / SPEED_STEP) * SPEED_STEP;
  return Number(clamp(snapped, MIN_SPEED, MAX_SPEED).toFixed(1));
}

export default function PlayerScreen() {
  const nowPlaying = getFallbackNowPlaying();
  const { isTablet, hPad } = useResponsive();
  const params = useLocalSearchParams<{ episodeId?: string; seriesId?: string; resumeTime?: string }>();
  const resumeTime = params.resumeTime ? Number(params.resumeTime) : null;
  const resumeEpisodeId = resumeTime !== null ? (params.episodeId ?? null) : null;
  const hasResumedRef = useRef(false);
  const seriesId = params.seriesId ?? nowPlaying.seriesId;
  const { story: baseSeries, isLoading } = useStory(seriesId);
  const [selectedSpeed, setSelectedSpeed] = useState(1.2);
  const [speedInputValue, setSpeedInputValue] = useState("1.2");
  const [showSpeedEditor, setShowSpeedEditor] = useState(false);
  const [showSleepTimerSheet, setShowSleepTimerSheet] = useState(false);
  const [sleepTimerKey, setSleepTimerKey] = useState<SleepTimerOptionKey>("off");
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(params.episodeId ?? null);
  const [isEpisodeSwitching, setIsEpisodeSwitching] = useState(false);
  const [episodeAssets, setEpisodeAssets] = useState<Record<string, Episode>>({});
  const [episodeAssetError, setEpisodeAssetError] = useState<string | null>(null);
  const { setMeta, remoteNextRef, remotePrevRef } = usePlayerMeta();
  const sleepTimerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSleepTimer = () => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }
    setSleepTimerKey("off");
    setSleepTimerEndsAt(null);
  };

  const applySleepTimer = (nextKey: SleepTimerOptionKey) => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }

    if (nextKey === "off") {
      setSleepTimerKey("off");
      setSleepTimerEndsAt(null);
      setShowSleepTimerSheet(false);
      return;
    }

    if (nextKey === "episode") {
      setSleepTimerKey("episode");
      setSleepTimerEndsAt(null);
      setShowSleepTimerSheet(false);
      return;
    }

    const selectedOption = SLEEP_TIMER_OPTIONS.find((option) => option.key === nextKey) as SleepTimerOption | undefined;
    if (!selectedOption || !("minutes" in selectedOption)) {
      return;
    }

    const timeoutMs = selectedOption.minutes * 60 * 1000;
    const targetTime = Date.now() + timeoutMs;
    setSleepTimerKey(nextKey);
    setSleepTimerEndsAt(targetTime);
    sleepTimerTimeoutRef.current = setTimeout(() => {
      player.pause();
      setSleepTimerKey("off");
      setSleepTimerEndsAt(null);
      sleepTimerTimeoutRef.current = null;
    }, timeoutMs);
    setShowSleepTimerSheet(false);
  };

  useEffect(() => {
    setCurrentEpisodeId(params.episodeId ?? null);
  }, [params.episodeId]);

  useEffect(() => {
    return () => {
      if (sleepTimerTimeoutRef.current) {
        clearTimeout(sleepTimerTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    hasResumedRef.current = false;
  }, [resumeEpisodeId, resumeTime]);

  const orderedEpisodes = baseSeries?.episodes ?? [];

  useEffect(() => {
    if (currentEpisodeId || orderedEpisodes.length === 0) {
      return;
    }
    setCurrentEpisodeId(orderedEpisodes[orderedEpisodes.length - 1]?.id ?? null);
  }, [currentEpisodeId, orderedEpisodes]);

  const currentEpisode = useMemo(() => {
    if (currentEpisodeId) {
      const baseEpisode = orderedEpisodes.find((episode) => episode.id === currentEpisodeId) ?? null;
      if (!baseEpisode) {
        return null;
      }
      return {
        ...baseEpisode,
        ...(episodeAssets[currentEpisodeId] ?? {}),
      };
    }

    return orderedEpisodes[orderedEpisodes.length - 1] ?? null;
  }, [currentEpisodeId, episodeAssets, orderedEpisodes]);

  const player = useSingletonPlayer(currentEpisode?.audioUrl ?? null, currentEpisode?.id ?? null);
  const status = useAudioPlayerStatus(player);
  const hasAudio = Boolean(currentEpisode?.audioUrl);

  useEffect(() => {
    if (!currentEpisodeId || episodeAssets[currentEpisodeId]?.audioUrl) {
      return;
    }

    let isCancelled = false;
    setEpisodeAssetError(null);
    setIsEpisodeSwitching(true);

    loadEpisodeById(currentEpisodeId)
      .then((episode) => {
        if (isCancelled) {
          return;
        }
        setEpisodeAssets((prev) => ({ ...prev, [currentEpisodeId]: episode }));
      })
      .catch((err) => {
        if (isCancelled) {
          return;
        }
        setEpisodeAssetError(err instanceof Error ? err.message : "Không tải được audio tập này.");
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }
        setIsEpisodeSwitching(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentEpisodeId, episodeAssets]);

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
  }, [baseSeries, currentEpisode, setMeta]);

  useEffect(() => {
    player.setPlaybackRate(selectedSpeed, "medium");
  }, [player, selectedSpeed]);

  useEffect(() => {
    setSpeedInputValue(selectedSpeed.toFixed(1));
  }, [selectedSpeed]);

  // Seek to resume position once audio duration is known
  useEffect(() => {
    if (!resumeTime || hasResumedRef.current || status.duration <= 0) return;
    if (!currentEpisode?.id || currentEpisode.id !== resumeEpisodeId) return;
    hasResumedRef.current = true;
    player.seekTo(resumeTime);
    player.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode?.id, resumeEpisodeId, resumeTime, status.duration > 0]);

  // Auto-save progress every 5 seconds while playing
  const saveTickRef = useRef(-1);
  const playbackTick = Math.floor(status.currentTime / 5);
  useEffect(() => {
    if (!baseSeries || !currentEpisode || !status.playing) return;
    if (playbackTick === saveTickRef.current) return;
    saveTickRef.current = playbackTick;
    if (status.currentTime < 10) return;
    saveProgress(baseSeries.id, {
      episodeId: currentEpisode.id,
      episodeTitle: currentEpisode.title,
      currentTime: status.currentTime,
      savedAt: Date.now(),
    }, {
      seriesTitle: baseSeries.title,
    });
  }, [baseSeries, currentEpisode, playbackTick, status.currentTime, status.playing]);

  const prevDidJustFinishRef = useRef(false);
  useEffect(() => {
    const risingEdge = status.didJustFinish && !prevDidJustFinishRef.current;
    prevDidJustFinishRef.current = status.didJustFinish;

    if (!risingEdge || !currentEpisode || !baseSeries) return;

    if (sleepTimerKey === "episode") {
      clearSleepTimer();
      player.pause();
      clearProgress(baseSeries.id);
      return;
    }

    const currentIndex = orderedEpisodes.findIndex((ep) => ep.id === currentEpisode.id);
    const nextEpisode = currentIndex >= 0 ? orderedEpisodes[currentIndex + 1] : null;

    if (nextEpisode) {
      saveTickRef.current = -1;
      hasResumedRef.current = true;
      setIsEpisodeSwitching(true);
      setCurrentEpisodeId(nextEpisode.id);
    } else {
      clearProgress(baseSeries.id);
    }
  }, [baseSeries, currentEpisode, orderedEpisodes, player, sleepTimerKey, status.didJustFinish]);

  const episodeIndex = orderedEpisodes.findIndex((episode) => episode.id === currentEpisode?.id);
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const sleepTimerLabel = useMemo(() => {
    const activeOption = SLEEP_TIMER_OPTIONS.find((option) => option.key === sleepTimerKey);
    if (!activeOption) {
      return "Tắt";
    }

    if (sleepTimerKey !== "episode" || !sleepTimerEndsAt) {
      return activeOption.shortLabel;
    }

    const remainingMinutes = Math.max(1, Math.ceil((sleepTimerEndsAt - Date.now()) / 60_000));
    return `${remainingMinutes}p`;
  }, [sleepTimerEndsAt, sleepTimerKey]);

  // Sync remote command callbacks each render so they always have the latest episode state
  remoteNextRef.current = episodeIndex >= 0 && episodeIndex < orderedEpisodes.length - 1
    ? () => changeEpisode(1) : null;
  remotePrevRef.current = episodeIndex > 0
    ? () => changeEpisode(-1) : null;

  const trackWidthRef = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  const playerRef = useRef(player);
  playerRef.current = player;
  const hasAudioRef = useRef(hasAudio);
  hasAudioRef.current = hasAudio;
  const isDraggingRef = useRef(false);
  const postSeekProgressRef = useRef<number | null>(null);
  const trackPageXRef = useRef(0);
  const lastKnownRatioRef = useRef(0);
  const lastDragTimeUpdateRef = useRef(0);

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

  const applySpeedValue = (value: number) => {
    const nextSpeed = snapSpeed(value);
    setSelectedSpeed(nextSpeed);
    setSpeedInputValue(nextSpeed.toFixed(1));
  };

  const adjustSpeed = (delta: number) => {
    applySpeedValue(selectedSpeed + delta);
  };

  const commitSpeedInput = () => {
    const normalized = speedInputValue.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      setSpeedInputValue(selectedSpeed.toFixed(1));
      return;
    }
    applySpeedValue(parsed);
    setShowSpeedEditor(false);
  };

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
      // Never yield the gesture to another responder once started
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        isDraggingRef.current = true;
        lastDragTimeUpdateRef.current = 0;
        if (statusRef.current.playing) playerRef.current.pause();
        trackPageXRef.current = evt.nativeEvent.pageX - evt.nativeEvent.locationX;
        const ratio = Math.min(Math.max(evt.nativeEvent.locationX / trackWidthRef.current, 0), 1);
        lastKnownRatioRef.current = ratio;
        animatedProgress.setValue(ratio);
        setDragDisplayTime(ratio * statusRef.current.duration);
      },
      onPanResponderMove: (_, gestureState) => {
        const ratio = Math.min(Math.max((gestureState.moveX - trackPageXRef.current) / trackWidthRef.current, 0), 1);
        lastKnownRatioRef.current = ratio;
        animatedProgress.setValue(ratio);
        const now = Date.now();
        if (now - lastDragTimeUpdateRef.current > 80) {
          lastDragTimeUpdateRef.current = now;
          setDragDisplayTime(ratio * statusRef.current.duration);
        }
      },
      onPanResponderRelease: () => {
        // Use lastKnownRatioRef — always correct whether tap or drag
        const ratio = lastKnownRatioRef.current;
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
    const nextEpisode = orderedEpisodes[episodeIndex + direction];
    if (!nextEpisode) return;
    saveTickRef.current = -1;
    hasResumedRef.current = true;
    setIsEpisodeSwitching(true);
    setShowTranscript(false);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 48 : 0}
        style={styles.keyboardContainer}
      >
      <ScrollView
        contentContainerStyle={[styles.content, isTablet && { paddingHorizontal: hPad }]}
        keyboardShouldPersistTaps="handled"
      >
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
            {currentEpisode?.durationLabel ?? "Chưa rõ"} • {selectedSpeed.toFixed(1)}x
          </Text>
          {!hasAudio && !isEpisodeSwitching && !episodeAssetError ? (
            <Text style={styles.helperText}>Tập này chưa có file audio thật.</Text>
          ) : null}
          {episodeAssetError ? <Text style={styles.helperText}>Lỗi tải audio: {episodeAssetError}</Text> : null}
        </View>

        <View style={styles.timeline}>
          <View
            hitSlop={{ top: 20, bottom: 20, left: 8, right: 8 }}
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
          <ControlButton
            disabled={episodeIndex <= 0}
            icon="skip-back"
            label="Tập trước"
            onPress={() => changeEpisode(-1)}
          />
          <ControlButton disabled={!hasAudio} icon="rotate-ccw" label="-15s" onPress={() => seekBy(-15)} />
          <Pressable
            disabled={!hasAudio}
            onPress={togglePlayback}
            style={[styles.primaryButton, isTablet && styles.primaryButtonTablet, !hasAudio && styles.disabledButton]}
          >
            <Feather color="#11131C" name={status.playing ? "pause" : "play"} size={26} />
          </Pressable>
          <ControlButton disabled={!hasAudio} icon="rotate-cw" label="+15s" onPress={() => seekBy(15)} />
          <ControlButton
            disabled={episodeIndex < 0 || episodeIndex >= orderedEpisodes.length - 1}
            icon="skip-forward"
            label="Tập sau"
            onPress={() => changeEpisode(1)}
          />
        </View>

        <View style={styles.inlineSettingsSection}>
          <View style={styles.speedControlRow}>
            <Text style={styles.speedInlineLabel}>Tốc độ</Text>
            <Pressable onPress={() => adjustSpeed(-SPEED_STEP)} style={styles.speedAdjustButton}>
              <Feather color={theme.colors.text} name="minus" size={16} />
            </Pressable>
            <Pressable onPress={() => setShowSpeedEditor(true)} style={styles.speedValueButton}>
              <Text style={styles.speedValueButtonText}>{selectedSpeed.toFixed(1)}</Text>
            </Pressable>
            <Pressable onPress={() => adjustSpeed(SPEED_STEP)} style={styles.speedAdjustButton}>
              <Feather color={theme.colors.text} name="plus" size={16} />
            </Pressable>
          </View>
          <View style={styles.speedControlRow}>
            <Text style={styles.speedInlineLabel}>Hẹn giờ</Text>
            <Pressable onPress={() => setShowSleepTimerSheet(true)} style={styles.speedValueButton}>
              <Text style={styles.speedValueButtonText}>{sleepTimerLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.utilityRow}>
          <UtilityTile
            label="Danh sách tập"
            value={`${orderedEpisodes.length}`}
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
              data={orderedEpisodes}
              keyExtractor={(ep) => ep.id}
              contentContainerStyle={styles.sheetList}
              renderItem={({ item: ep }) => {
                const isCurrent = ep.id === currentEpisode?.id;
                return (
                  <Pressable
                    style={[styles.sheetRow, isCurrent && styles.sheetRowActive]}
                    onPress={() => {
                      setShowEpisodes(false);
                      saveTickRef.current = -1;
                      hasResumedRef.current = true;
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

        <Modal animationType="slide" transparent visible={showSpeedEditor} onRequestClose={() => setShowSpeedEditor(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSpeedEditor(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
          >
            <View style={styles.speedSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Tốc độ nghe</Text>
              <View style={styles.speedEditorRow}>
                <Pressable onPress={() => adjustSpeed(-SPEED_STEP)} style={styles.speedAdjustButtonLarge}>
                  <Feather color={theme.colors.text} name="minus" size={18} />
                </Pressable>
                <TextInput
                  autoFocus
                  keyboardType="decimal-pad"
                  onBlur={commitSpeedInput}
                  onChangeText={setSpeedInputValue}
                  onSubmitEditing={commitSpeedInput}
                  returnKeyType="done"
                  style={styles.speedEditorInput}
                  value={speedInputValue}
                />
                <Pressable onPress={() => adjustSpeed(SPEED_STEP)} style={styles.speedAdjustButtonLarge}>
                  <Feather color={theme.colors.text} name="plus" size={18} />
                </Pressable>
              </View>
              <View style={styles.speedEditorActions}>
                <Pressable onPress={() => setShowSpeedEditor(false)} style={styles.speedEditorSecondary}>
                  <Text style={styles.speedEditorSecondaryText}>Đóng</Text>
                </Pressable>
                <Pressable onPress={commitSpeedInput} style={styles.speedEditorPrimary}>
                  <Text style={styles.speedEditorPrimaryText}>Xong</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal animationType="slide" transparent visible={showSleepTimerSheet} onRequestClose={() => setShowSleepTimerSheet(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSleepTimerSheet(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Hẹn giờ tắt</Text>
            <View style={styles.sleepOptions}>
              {SLEEP_TIMER_OPTIONS.map((option) => {
                const isActive = option.key === sleepTimerKey;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => applySleepTimer(option.key)}
                    style={[styles.sleepOptionRow, isActive && styles.sleepOptionRowActive]}
                  >
                    <Text style={[styles.sleepOptionText, isActive && styles.sleepOptionTextActive]}>{option.label}</Text>
                    {isActive ? <Feather color={theme.colors.warning} name="check" size={18} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
      </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1
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
    gap: 6,
    minWidth: 56
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
  inlineSettingsSection: {
    alignItems: "flex-start",
    gap: 12
  },
  speedControlRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  speedInlineLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginRight: 4
  },
  speedValueButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minWidth: 54,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  speedValueButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  speedAdjustButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  speedSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    gap: 16,
    padding: theme.spacing.lg,
    paddingBottom: 32
  },
  speedEditorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center"
  },
  speedAdjustButtonLarge: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  speedEditorInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: "center"
  },
  speedEditorActions: {
    flexDirection: "row",
    gap: 12
  },
  speedEditorSecondary: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  speedEditorSecondaryText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  speedEditorPrimary: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  speedEditorPrimaryText: {
    color: "#11131C",
    fontSize: 15,
    fontWeight: "800"
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
  sleepOptions: {
    gap: 6,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 20
  },
  sleepOptionRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14
  },
  sleepOptionRowActive: {
    borderColor: theme.colors.warning,
    borderWidth: 1
  },
  sleepOptionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  sleepOptionTextActive: {
    color: theme.colors.warning
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
