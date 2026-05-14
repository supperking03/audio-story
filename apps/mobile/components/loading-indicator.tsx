import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";

export function LoadingIndicator({
  centered = false,
  label
}: {
  centered?: boolean;
  label?: string;
}) {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <ActivityIndicator color={theme.colors.accent} size="small" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  centered: {
    justifyContent: "center"
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600"
  }
});
