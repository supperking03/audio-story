import TrackPlayer from "react-native-track-player";
import "expo-router/entry";

import { PlaybackService } from "./services/playback-service";

TrackPlayer.registerPlaybackService(() => PlaybackService);
