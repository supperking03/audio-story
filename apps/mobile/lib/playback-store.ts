import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedProgress = {
  episodeId: string;
  episodeTitle: string;
  currentTime: number;
  savedAt: number;
};

const key = (seriesId: string) => `progress_v1_${seriesId}`;

export async function saveProgress(seriesId: string, data: SavedProgress) {
  try {
    await AsyncStorage.setItem(key(seriesId), JSON.stringify(data));
  } catch {}
}

export async function loadProgress(seriesId: string): Promise<SavedProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(key(seriesId));
    if (!raw) return null;
    return JSON.parse(raw) as SavedProgress;
  } catch {
    return null;
  }
}

export async function clearProgress(seriesId: string) {
  try {
    await AsyncStorage.removeItem(key(seriesId));
  } catch {}
}
