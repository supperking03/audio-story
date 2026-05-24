import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const INDEX_KEY = "bubu_offline_episodes";
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}offline/`;

export type OfflineEntry = {
  episodeId: string;
  localPath: string;
  title: string;
  seriesTitle: string;
  seriesId?: string;
  savedAt: number;
};

async function readIndex(): Promise<Record<string, OfflineEntry>> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OfflineEntry>) : {};
  } catch {
    return {};
  }
}

async function writeIndex(index: Record<string, OfflineEntry>): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

export async function getOfflineUri(episodeId: string): Promise<string | null> {
  const index = await readIndex();
  const entry = index[episodeId];
  if (!entry) return null;
  const info = await FileSystem.getInfoAsync(entry.localPath);
  return info.exists ? entry.localPath : null;
}

export async function isDownloaded(episodeId: string): Promise<boolean> {
  return (await getOfflineUri(episodeId)) !== null;
}

export type DownloadProgressCallback = (progress: number) => void;

export async function listDownloadedEpisodes(): Promise<OfflineEntry[]> {
  const index = await readIndex();
  const entries = Object.values(index);
  const verified: OfflineEntry[] = [];
  for (const entry of entries) {
    const info = await FileSystem.getInfoAsync(entry.localPath);
    if (info.exists) verified.push(entry);
  }
  return verified.sort((a, b) => b.savedAt - a.savedAt);
}

export async function getDownloadedFileSize(localPath: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(localPath);
  return (info as { size?: number }).size ?? 0;
}

export async function downloadEpisode(
  episodeId: string,
  audioUrl: string,
  title: string,
  seriesTitle: string,
  onProgress?: DownloadProgressCallback,
  seriesId?: string,
): Promise<string> {
  await ensureDir();
  const ext = audioUrl.split("?")[0].split(".").pop() ?? "mp3";
  const localPath = `${DOWNLOAD_DIR}${episodeId}.${ext}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    audioUrl,
    localPath,
    {},
    (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesExpectedToWrite > 0
          ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
          : 0;
      onProgress?.(progress);
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) throw new Error("Download failed");

  const index = await readIndex();
  index[episodeId] = { episodeId, localPath: result.uri, title, seriesTitle, seriesId, savedAt: Date.now() };
  await writeIndex(index);
  return result.uri;
}

export async function deleteOfflineEpisode(episodeId: string): Promise<void> {
  const index = await readIndex();
  const entry = index[episodeId];
  if (entry) {
    try {
      await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
    } catch {}
    delete index[episodeId];
    await writeIndex(index);
  }
}
