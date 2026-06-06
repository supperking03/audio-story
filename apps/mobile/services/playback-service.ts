import TrackPlayer, { Event } from "react-native-track-player";

import { clearProgress, saveProgress } from "../lib/playback-store";
import { recordEpisodeFinished } from "../lib/review-prompt";

type ServiceTrack = {
  id: string;
  title?: string;
  artist?: string;
  seriesId?: string;
  seriesTitle?: string;
};

export async function PlaybackService() {
  let lastActiveTrack: ServiceTrack | undefined;

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    void TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    void TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    await TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (event) => {
    if (event.position < 10) return;

    const activeTrack = (await TrackPlayer.getActiveTrack()) as ServiceTrack | undefined;
    if (!activeTrack?.seriesId || !activeTrack.title) return;

    await saveProgress(
      activeTrack.seriesId,
      {
        episodeId: activeTrack.id,
        episodeTitle: activeTrack.title,
        currentTime: event.position,
        savedAt: Date.now(),
      },
      {
        seriesTitle: activeTrack.seriesTitle ?? activeTrack.artist,
      },
    );
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async ({ lastTrack, track, lastPosition }) => {
    lastActiveTrack = (track ?? lastTrack ?? lastActiveTrack) as ServiceTrack | undefined;

    if (!lastTrack?.seriesId || !lastTrack.title) return;

    if (lastPosition >= 10) {
      await saveProgress(
        lastTrack.seriesId,
        {
          episodeId: lastTrack.id,
          episodeTitle: lastTrack.title,
          currentTime: lastPosition,
          savedAt: Date.now(),
        },
        {
          seriesTitle: lastTrack.seriesTitle ?? lastTrack.artist,
        },
      );
    }

    if (track) {
      await recordEpisodeFinished();
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (event) => {
    const queueTrack =
      typeof event.track === "number"
        ? ((await TrackPlayer.getTrack(event.track)) as ServiceTrack | undefined)
        : lastActiveTrack;

    if (event.position >= 10 && queueTrack?.title && queueTrack.seriesId) {
      await saveProgress(
        queueTrack.seriesId,
        {
          episodeId: queueTrack.id,
          episodeTitle: queueTrack.title,
          currentTime: event.position,
          savedAt: Date.now(),
        },
        {
          seriesTitle: queueTrack.seriesTitle ?? queueTrack.artist,
        },
      );
      await recordEpisodeFinished();
      await clearProgress(queueTrack.seriesId);
    }
  });
}
