import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AppSplash({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, opacity]);

  if (!mounted) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { opacity }]}>
      <View style={[styles.inner, { paddingBottom: insets.bottom + 32 }]}>
        <Image resizeMode="contain" source={require("../assets/icon.png")} style={styles.logo} />
        <Text style={styles.title}>BuBu</Text>
        <Text style={styles.subtitle}>Truyện Audio</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A0B11",
    zIndex: 999,
  },
  inner: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  logo: {
    borderRadius: 28,
    height: 120,
    width: 120,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
