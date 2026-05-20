import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";
import { getStoredPushPreference, savePushPreference } from "../lib/push-notifications";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationSettingsSheet({ visible, onClose }: Props) {
  const [wantsNotif, setWantsNotif] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      setSaved(false);
      getStoredPushPreference().then(setWantsNotif);
    }
  }, [visible]);

  const handleSave = async () => {
    setIsSaving(true);
    await savePushPreference(wantsNotif);
    setIsSaving(false);
    setSaved(true);
    setTimeout(onClose, 600);
  };

  const toggle = () => setWantsNotif((v) => !v);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Feather color={theme.colors.text} name="settings" size={18} />
          <Text style={styles.title}>Cài đặt thông báo</Text>
        </View>

        <Pressable onPress={toggle} style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowLabel}>Truyện & chương mới</Text>
            <Text style={styles.rowSub}>Thông báo khi có nội dung mới được thêm vào</Text>
          </View>
          <View style={[styles.toggle, wantsNotif && styles.toggleOn]}>
            <View style={[styles.toggleThumb, wantsNotif && styles.toggleThumbOn]} />
          </View>
        </Pressable>

        <Pressable
          disabled={isSaving}
          onPress={() => { void handleSave(); }}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#11131C" size="small" />
          ) : saved ? (
            <>
              <Feather color="#11131C" name="check" size={16} />
              <Text style={styles.saveButtonText}>Đã lưu</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>Lưu cài đặt</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    bottom: 0,
    gap: 16,
    left: 0,
    padding: theme.spacing.lg,
    paddingBottom: 40,
    position: "absolute",
    right: 0,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    height: 4,
    marginBottom: 4,
    width: 40,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  row: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 14,
    padding: theme.spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rowSub: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    backgroundColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: "center",
    padding: 3,
    width: 50,
  },
  toggleOn: {
    backgroundColor: theme.colors.accent,
  },
  toggleThumb: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.radius.pill,
    height: 22,
    width: 22,
  },
  toggleThumbOn: {
    transform: [{ translateX: 22 }],
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: theme.colors.warning,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.75,
  },
  saveButtonText: {
    color: "#11131C",
    fontSize: 15,
    fontWeight: "800",
  },
});
