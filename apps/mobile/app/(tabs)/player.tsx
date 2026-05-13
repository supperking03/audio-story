import { Feather } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../../constants/theme";
import { getFallbackNowPlaying } from "../../data/story-service";
import { useStory } from "../../hooks/use-story";

const speedOptions = ["0.8x", "1.0x", "1.2x", "1.5x", "2.0x"];

function disableLockScreenControls(player: {
  setActiveForLockScreen?: (active: boolean) => void;
  clearLockScreenControls?: () => void;
}) {
  if (typeof player.clearLockScreenControls === "function") {
    player.clearLockScreenControls();
    return;
  }

  if (typeof player.setActiveForLockScreen === "function") {
    player.setActiveForLockScreen(false);
  }
}

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
  const params = useLocalSearchParams<{ episodeId?: string; seriesId?: string }>();
  const seriesId = params.seriesId ?? nowPlaying.seriesId;
  const { story: baseSeries, isLoading } = useStory(seriesId);
  const [selectedSpeed, setSelectedSpeed] = useState("1.2x");
  const currentEpisode = useMemo(() => {
    if (params.episodeId) {
      return baseSeries?.episodes.find((episode) => episode.id === params.episodeId) ?? null;
    }

    return baseSeries?.episodes[0] ?? null;
  }, [baseSeries, params.episodeId]);
  const player = useAudioPlayer(currentEpisode?.audioUrl ?? null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const hasAudio = Boolean(currentEpisode?.audioUrl);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix"
    }).catch(() => {
      // Keep the player usable even if audio mode config fails on a simulator/device.
    });
  }, []);

  useEffect(() => {
    if (!hasAudio) {
      disableLockScreenControls(player);
      return;
    }

    player.setActiveForLockScreen(
      true,
      {
        title: currentEpisode?.title ?? nowPlaying.episodeTitle,
        artist: baseSeries?.title ?? nowPlaying.title,
        artworkUrl: baseSeries?.coverImageUrl ?? undefined
      },
      {
        showSeekBackward: true,
        showSeekForward: true
      }
    );

    return () => {
      disableLockScreenControls(player);
    };
  }, [
    baseSeries?.coverImageUrl,
    baseSeries?.title,
    currentEpisode?.title,
    hasAudio,
    nowPlaying.episodeTitle,
    nowPlaying.title,
    player
  ]);

  useEffect(() => {
    player.setPlaybackRate(Number.parseFloat(selectedSpeed), "medium");
  }, [player, selectedSpeed]);

  const episodeIndex = baseSeries?.episodes.findIndex((episode) => episode.id === currentEpisode?.id) ?? -1;
  const progress = status.duration > 0 ? status.currentTime / status.duration : nowPlaying.progress;

  const changeEpisode = (direction: -1 | 1) => {
    if (!baseSeries || episodeIndex < 0) {
      return;
    }

    const nextEpisode = baseSeries.episodes[episodeIndex + direction];
    if (!nextEpisode) {
      return;
    }

    router.replace({
      pathname: "/player",
      params: { seriesId: baseSeries.id, episodeId: nextEpisode.id }
    });
  };

  const togglePlayback = async () => {
    if (!hasAudio) {
      return;
    }

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
    if (!hasAudio || status.duration <= 0) {
      return;
    }

    const nextTime = Math.min(Math.max(0, status.currentTime + offsetSeconds), status.duration);
    player.seekTo(nextTime);
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Đang tải audio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.content}>
        <LinearGradient colors={["#5C1A1B", "#A63D40", "#E09F3E"]} style={styles.coverArt}>
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
          <View style={styles.timelineTrack}>
            <View style={[styles.timelineFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]} />
          </View>
          <View style={styles.timelineLabels}>
            <Text style={styles.timelineText}>{formatClock(status.currentTime)}</Text>
            <Text style={styles.timelineText}>{formatClock(status.duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <ControlButton disabled={!hasAudio} icon="rotate-ccw" label="15s" onPress={() => seekBy(-15)} />
          <ControlButton disabled={!baseSeries || episodeIndex >= baseSeries.episodes.length - 1} icon="skip-back" label="" onPress={() => changeEpisode(1)} />
          <Pressable
            disabled={!hasAudio}
            onPress={togglePlayback}
            style={[styles.primaryButton, !hasAudio && styles.disabledButton]}
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
          <UtilityTile label="Audio" value={hasAudio ? "Ready" : "Pending"} />
          <UtilityTile label="Episodes" value={`${baseSeries?.episodes.length ?? 0}`} />
        </View>
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

function UtilityTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.utilityTile}>
      <Text style={styles.utilityLabel}>{label}</Text>
      <Text style={styles.utilityValue}>{value}</Text>
    </View>
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
  coverArt: {
    borderRadius: 32,
    gap: 6,
    justifyContent: "flex-end",
    minHeight: 320,
    padding: 24
  },
  coverTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800"
  },
  coverEpisode: {
    color: "#FFF3D1",
    fontSize: 15
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
  utilityValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: "600"
  }
});
