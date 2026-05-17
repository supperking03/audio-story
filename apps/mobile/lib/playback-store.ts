import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedProgress = {
  episodeId: string;
  episodeTitle: string;
  currentTime: number;
  savedAt: number;
};

export type ListeningHistoryItem = {
  seriesId: string;
  seriesTitle: string;
  episodeId: string;
  episodeTitle: string;
  currentTime: number;
  savedAt: number;
};

const key = (seriesId: string) => `progress_v1_${seriesId}`;
const historyKey = "listening_history_v1";

async function saveListeningHistory(item: ListeningHistoryItem) {
  try {
    const raw = await AsyncStorage.getItem(historyKey);
    const existing = raw ? (JSON.parse(raw) as ListeningHistoryItem[]) : [];
    const next = [
      item,
      ...existing.filter((entry) => !(entry.seriesId === item.seriesId && entry.episodeId === item.episodeId)),
    ]
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, 100);
    await AsyncStorage.setItem(historyKey, JSON.stringify(next));
  } catch {}
}

export async function saveProgress(
  seriesId: string,
  data: SavedProgress,
  meta?: { seriesTitle?: string }
) {
  try {
    await AsyncStorage.setItem(key(seriesId), JSON.stringify(data));
    if (meta?.seriesTitle) {
      await saveListeningHistory({
        seriesId,
        seriesTitle: meta.seriesTitle,
        episodeId: data.episodeId,
        episodeTitle: data.episodeTitle,
        currentTime: data.currentTime,
        savedAt: data.savedAt,
      });
    }
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

export async function loadListeningHistory(): Promise<ListeningHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(historyKey);
    if (!raw) return [];
    return (JSON.parse(raw) as ListeningHistoryItem[]).sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export async function removeListeningHistoryItem(seriesId: string, episodeId: string) {
  try {
    const existing = await loadListeningHistory();
    const next = existing.filter((entry) => !(entry.seriesId === seriesId && entry.episodeId === episodeId));
    await AsyncStorage.setItem(historyKey, JSON.stringify(next));
  } catch {}
}

export async function clearListeningHistory() {
  try {
    await AsyncStorage.removeItem(historyKey);
  } catch {}
}
