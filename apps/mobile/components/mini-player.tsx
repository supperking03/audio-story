import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import TrackPlayer, { Event, State, usePlaybackState, useProgress } from "react-native-track-player";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayerMeta } from "../contexts/player-context";
import { theme } from "../constants/theme";

export function MiniPlayer() {
  const pathname = usePathname();
  const { meta, setMeta } = usePlayerMeta();
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress(0.5);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, ({ track }) => {
      if (!track?.id || !track.title) return;
      const episodeId = track.id;
      const episodeTitle = track.title;
      const seriesTitle = track.artist;
      const artwork = track.artwork;
      setMeta((currentMeta) => {
        if (!currentMeta) return currentMeta;
        return {
          ...currentMeta,
          episodeId,
          episodeTitle,
          seriesTitle: seriesTitle ?? currentMeta.seriesTitle,
          coverImageUrl:
            typeof artwork === "string" ? artwork : currentMeta.coverImageUrl,
        };
      });
    });

    return () => {
      subscription.remove();
    };
  }, [setMeta]);

  if (pathname === "/player" || !meta) return null;

  const progress = duration > 0 ? position / duration : 0;
  const playbackStateValue =
    typeof playbackState === "object" && playbackState !== null && "state" in playbackState
      ? playbackState.state
      : playbackState;
  const isPlaying = playbackStateValue === State.Playing;

  const openPlayer = () => {
    router.push({ pathname: "/player", params: { seriesId: meta.seriesId, episodeId: meta.episodeId } });
  };

  const closeMiniPlayer = async () => {
    await TrackPlayer.stop();
    await TrackPlayer.reset();
    setMeta(null);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]} />
      </View>
      <View style={[styles.row, isTablet && { maxWidth: 800, alignSelf: "center", width: "100%" }]}>
        <Pressable onPress={openPlayer} style={styles.coverWrap}>
          <LinearGradient colors={meta.coverColor} style={styles.cover} />
        </Pressable>
        <Pressable onPress={openPlayer} style={styles.infoArea}>
          <Text style={styles.episodeTitle} numberOfLines={1}>{meta.episodeTitle}</Text>
          <Text style={styles.seriesTitle} numberOfLines={1}>{meta.seriesTitle}</Text>
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={() => (isPlaying ? TrackPlayer.pause() : TrackPlayer.play())}
          style={styles.playBtn}
        >
          <Feather color={theme.colors.text} name={isPlaying ? "pause" : "play"} size={20} />
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={closeMiniPlayer}
          style={styles.closeBtn}
        >
          <Feather color={theme.colors.textMuted} name="x" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.line,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  progressTrack: {
    backgroundColor: theme.colors.surfaceElevated,
    height: 2,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: theme.colors.accent,
    height: "100%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    height: 68,
    paddingHorizontal: theme.spacing.md,
  },
  coverWrap: {
    borderRadius: theme.radius.sm,
    overflow: "hidden",
  },
  cover: {
    borderRadius: theme.radius.sm,
    height: 44,
    width: 44,
  },
  infoArea: {
    flex: 1,
    gap: 3,
  },
  episodeTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  seriesTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  playBtn: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  closeBtn: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
