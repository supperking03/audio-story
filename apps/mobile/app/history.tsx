import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants/theme";
import {
  clearListeningHistory,
  type ListeningHistoryItem,
  loadListeningHistory,
  removeListeningHistoryItem,
} from "../lib/playback-store";

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatSavedAt(value: number) {
  const diffMinutes = Math.round((Date.now() - value) / 60000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function HistoryScreen() {
  const [items, setItems] = useState<ListeningHistoryItem[]>([]);

  const refresh = useCallback(async () => {
    const nextItems = await loadListeningHistory();
    setItems(nextItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const openHistoryItem = (item: ListeningHistoryItem) => {
    router.push({
      pathname: "/player",
      params: {
        seriesId: item.seriesId,
        episodeId: item.episodeId,
        resumeTime: String(Math.floor(item.currentTime)),
      },
    });
  };

  const confirmClearAll = () => {
    Alert.alert("Xóa toàn bộ lịch sử?", "Bạn sẽ mất danh sách nghe gần đây trên thiết bị này.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa hết",
        style: "destructive",
        onPress: async () => {
          await clearListeningHistory();
          setItems([]);
        },
      },
    ]);
  };

  const removeItem = (item: ListeningHistoryItem) => {
    Alert.alert("Xóa mục này?", `${item.seriesTitle} • ${item.episodeTitle}`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await removeListeningHistoryItem(item.seriesId, item.episodeId);
          setItems((prev) =>
            prev.filter((entry) => !(entry.seriesId === item.seriesId && entry.episodeId === item.episodeId))
          );
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
            <Text style={styles.headerTitle}>Lịch sử nghe</Text>
            <Text style={styles.headerSubtitle}>Truyện nghe gần nhất ở trên cùng</Text>
          </View>
          <Pressable onPress={() => router.push("/downloads" as never)} style={styles.iconButton}>
            <Feather color={theme.colors.text} name="download" size={18} />
          </Pressable>
          <Pressable disabled={items.length === 0} onPress={confirmClearAll} style={[styles.iconButton, items.length === 0 && styles.disabledButton]}>
            <Feather color={theme.colors.text} name="trash-2" size={18} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có lịch sử nghe</Text>
              <Text style={styles.emptyText}>Khi bạn nghe truyện, chương gần nhất sẽ được lưu lại ở đây.</Text>
            </View>
          ) : (
            items.map((item) => (
              <Pressable key={`${item.seriesId}-${item.episodeId}`} onPress={() => openHistoryItem(item)} style={styles.historyCard}>
                <View style={styles.historyCopy}>
                  <Text numberOfLines={1} style={styles.seriesTitle}>{item.seriesTitle}</Text>
                  <Text numberOfLines={2} style={styles.episodeTitle}>{item.episodeTitle}</Text>
                  <Text style={styles.metaText}>
                    {formatClock(item.currentTime)} • {formatSavedAt(item.savedAt)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => removeItem(item)} style={styles.deleteButton}>
                    <Feather color={theme.colors.textMuted} name="x" size={18} />
                  </Pressable>
                  <Feather color={theme.colors.textMuted} name="chevron-right" size={18} />
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
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  disabledButton: {
    opacity: 0.45,
  },
  list: {
    gap: 12,
    paddingBottom: 120,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  historyCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: theme.spacing.md,
  },
  historyCopy: {
    flex: 1,
    gap: 4,
  },
  seriesTitle: {
    color: theme.colors.accentSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  episodeTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  deleteButton: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
});
