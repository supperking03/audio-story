import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants/theme";
import { deleteOfflineEpisode, getDownloadedFileSize, listDownloadedEpisodes, type OfflineEntry } from "../lib/offline-store";

function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSavedAt(value: number) {
  const diffMinutes = Math.round((Date.now() - value) / 60000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

type EntryWithSize = OfflineEntry & { size: number };

export default function DownloadsScreen() {
  const [items, setItems] = useState<EntryWithSize[]>([]);

  const refresh = useCallback(async () => {
    const entries = await listDownloadedEpisodes();
    const withSizes: EntryWithSize[] = await Promise.all(
      entries.map(async (entry) => ({ ...entry, size: await getDownloadedFileSize(entry.localPath) })),
    );
    setItems(withSizes);
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  const openEpisode = (item: EntryWithSize) => {
    if (!item.seriesId) return;
    router.push({
      pathname: "/player",
      params: { seriesId: item.seriesId, episodeId: item.episodeId },
    });
  };

  const confirmDelete = (item: EntryWithSize) => {
    Alert.alert("Xóa file đã tải?", `${item.seriesTitle} • ${item.title}`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await deleteOfflineEpisode(item.episodeId);
          setItems((prev) => prev.filter((entry) => entry.episodeId !== item.episodeId));
        },
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert("Xóa toàn bộ file đã tải?", `Tổng ${items.length} tập, ${formatBytes(totalSize)}.`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa hết",
        style: "destructive",
        onPress: async () => {
          for (const item of items) {
            await deleteOfflineEpisode(item.episodeId);
          }
          setItems([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Feather color={theme.colors.text} name="arrow-left" size={18} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Tập đã tải</Text>
            <Text style={styles.headerSubtitle}>
              {items.length > 0 ? `${items.length} tập • ${formatBytes(totalSize)}` : "Quản lý file nghe offline"}
            </Text>
          </View>
          <Pressable disabled={items.length === 0} onPress={confirmDeleteAll} style={[styles.iconButton, items.length === 0 && styles.disabledButton]}>
            <Feather color={theme.colors.text} name="trash-2" size={18} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa tải tập nào</Text>
              <Text style={styles.emptyText}>Vào màn hình phát rồi bấm Tải về để nghe offline.</Text>
            </View>
          ) : (
            items.map((item) => (
              <Pressable key={item.episodeId} onPress={() => openEpisode(item)} style={styles.card}>
                <View style={styles.copy}>
                  <Text numberOfLines={1} style={styles.seriesTitle}>{item.seriesTitle}</Text>
                  <Text numberOfLines={2} style={styles.episodeTitle}>{item.title}</Text>
                  <Text style={styles.metaText}>
                    {formatBytes(item.size)} • {formatSavedAt(item.savedAt)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => confirmDelete(item)} style={styles.deleteButton}>
                    <Feather color={theme.colors.textMuted} name="trash-2" size={18} />
                  </Pressable>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: theme.colors.background, flex: 1 },
  content: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.lg },
  headerRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { color: theme.colors.text, fontSize: 24, fontWeight: "800" },
  headerSubtitle: { color: theme.colors.textMuted, fontSize: 13 },
  iconButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  disabledButton: { opacity: 0.45 },
  list: { gap: 12, paddingBottom: 120 },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: theme.spacing.lg,
  },
  emptyTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },
  emptyText: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },
  card: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: theme.spacing.md,
  },
  copy: { flex: 1, gap: 4 },
  seriesTitle: { color: theme.colors.accentSoft, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  episodeTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  metaText: { color: theme.colors.textMuted, fontSize: 13 },
  actions: { alignItems: "center", flexDirection: "row", gap: 6 },
  deleteButton: { alignItems: "center", height: 32, justifyContent: "center", width: 32 },
});
