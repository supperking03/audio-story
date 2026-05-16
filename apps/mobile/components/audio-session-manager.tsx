import { setAudioModeAsync } from "expo-audio";
import { useEffect } from "react";

import { usePlayerMeta } from "../contexts/player-context";
import { getPlayer } from "../hooks/use-singleton-player";

export function AudioSessionManager() {
  const { meta } = usePlayerMeta();
  const player = getPlayer();

  // Set audio mode once on mount: background playback + silent mode
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
  }, []);

  // Update lock screen controls whenever the playing episode changes.
  // Lives here (root layout) so it never unmounts — lock screen persists
  // even when the user navigates away to the mini player.
  useEffect(() => {
    if (!meta) return;
    try {
      player.setActiveForLockScreen(
        true,
        {
          title: meta.episodeTitle,
          artist: meta.seriesTitle,
          artworkUrl: meta.coverImageUrl ?? undefined,
        },
        { showSeekBackward: true, showSeekForward: true }
      );
    } catch {}
    // No cleanup — intentionally keep lock screen active while audio plays
  }, [meta, player]);

  return null;
}
