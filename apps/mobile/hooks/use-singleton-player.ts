import { AudioPlayer, createAudioPlayer } from "expo-audio";
import { useEffect } from "react";

let _player: AudioPlayer | null = null;
let _currentEpisodeId: string | null = null;
let _currentSource: string | null = null;

export function getPlayer(): AudioPlayer {
  if (!_player) {
    _player = createAudioPlayer();
  }
  return _player;
}

export function useSingletonPlayer(source: string | null, episodeId: string | null) {
  const player = getPlayer();

  useEffect(() => {
    if (!source || !episodeId) return;
    if (episodeId === _currentEpisodeId && source === _currentSource) return;
    _currentEpisodeId = episodeId;
    _currentSource = source;
    player.replace({ uri: source });
    player.play();
    // player is a stable module-level singleton, not a reactive dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId, source]);

  return player;
}
