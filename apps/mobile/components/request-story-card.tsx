import { Feather } from "@expo/vector-icons";
import { postJson } from "../lib/api";
import { theme } from "../constants/theme";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type RequestStoryCardProps = {
  suggestedTitle?: string;
  title?: string;
  body?: string;
};

export function RequestStoryCard({
  suggestedTitle,
  title = "Thiếu truyện bạn muốn nghe?",
  body = "Gửi tên truyện để mình bổ sung sau.",
}: RequestStoryCardProps) {
  const [requestedTitle, setRequestedTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    setStatus("");
    setRequestedTitle((current) => current || suggestedTitle || "");
    setShowModal(true);
  };

  const submitRequest = async () => {
    const titleValue = requestedTitle.trim();
    if (!titleValue) {
      setStatus("Nhập tên truyện trước đã.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    try {
      await postJson("/api/mobile/story-requests", { title: titleValue });
      setRequestedTitle("");
      setShowModal(false);
      setStatus("Đã nhận yêu cầu của bạn.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Chưa gửi được yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Pressable onPress={openModal} style={styles.card}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Yêu cầu truyện</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {status ? <Text style={styles.inlineStatus}>{status}</Text> : null}
        </View>
        <View style={styles.actionRow}>
          <View style={styles.badge}>
            <Feather color="#11131C" name="plus" size={16} />
            <Text style={styles.badgeText}>Gửi tên truyện</Text>
          </View>
          <Feather color={theme.colors.warning} name="chevron-right" size={20} />
        </View>
      </Pressable>

      <Modal animationType="slide" transparent visible={showModal} onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
          style={styles.modalKeyboardContainer}
        >
          <View style={styles.sheetContainer}>
            <ScrollView
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.sheet}>
                <View style={styles.handle} />
                <Text style={styles.sheetEyebrow}>Yêu cầu truyện</Text>
                <Text style={styles.sheetTitle}>Bạn muốn nghe truyện nào?</Text>
                <Text style={styles.sheetText}>Nhập tên truyện, mình sẽ ghi nhận để bổ sung sau.</Text>
                <TextInput
                  autoFocus
                  editable={!isSubmitting}
                  onChangeText={setRequestedTitle}
                  placeholder="Ví dụ: Vụng Trộm Không Thể Giấu"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={requestedTitle}
                />
                {status ? <Text style={styles.sheetStatus}>{status}</Text> : null}
                <View style={styles.actions}>
                  <Pressable disabled={isSubmitting} onPress={() => setShowModal(false)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryText}>Đóng</Text>
                  </Pressable>
                  <Pressable
                    disabled={isSubmitting}
                    onPress={() => {
                      void submitRequest();
                    }}
                    style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#11131C" size="small" />
                    ) : (
                      <Text style={styles.primaryText}>Gửi yêu cầu</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: theme.spacing.lg,
  },
  copy: {
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  inlineStatus: {
    color: theme.colors.accentSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  badgeText: {
    color: "#11131C",
    fontSize: 14,
    fontWeight: "800",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  modalKeyboardContainer: {
    flex: 1,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    gap: 12,
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    height: 4,
    marginBottom: 2,
    width: 42,
  },
  sheetEyebrow: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sheetTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  sheetText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sheetStatus: {
    color: theme.colors.accentSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    flex: 1.3,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryText: {
    color: "#11131C",
    fontSize: 15,
    fontWeight: "800",
  },
});
