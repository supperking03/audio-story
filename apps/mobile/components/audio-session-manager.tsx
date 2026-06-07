import { setAudioModeAsync } from "expo-audio";
import { useEffect } from "react";
import { NativeEventEmitter, NativeModules } from "react-native";

import { usePlayerMeta } from "../contexts/player-context";
import { getPlayer } from "../hooks/use-singleton-player";

const { RemoteCommandsModule } = NativeModules;
const remoteEmitter = RemoteCommandsModule ? new NativeEventEmitter(RemoteCommandsModule) : null;

export function AudioSessionManager() {
  const { meta, remoteNextRef, remotePrevRef } = usePlayerMeta();
  const player = getPlayer();

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
  }, []);

  // Enable next/previous lock screen commands and wire up callbacks via refs
  useEffect(() => {
    if (!RemoteCommandsModule || !remoteEmitter) return;
    RemoteCommandsModule.enable();
    const nextSub = remoteEmitter.addListener("onNextTrack", () => remoteNextRef.current?.());
    const prevSub = remoteEmitter.addListener("onPreviousTrack", () => remotePrevRef.current?.());
    return () => {
      nextSub.remove();
      prevSub.remove();
      RemoteCommandsModule.disable();
    };
  // refs are stable — subscribe once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [meta, player]);

  return null;
}
