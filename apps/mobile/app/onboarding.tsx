import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants/theme";

const ONBOARDING_KEY = "bubu_onboarding_done";

const slides = [
  {
    id: "welcome",
    kicker: "Chào mừng đến với",
    title: "BuBu",
    titleSub: "Truyện Audio",
    body: "Thư giãn mỗi ngày với hàng nghìn\ncâu chuyện âm thanh chọn lọc.",
    pills: null,
    features: null,
    accentColor: theme.colors.accent,
  },
  {
    id: "genres",
    kicker: "Phong phú thể loại",
    title: "Nghe là\nYêu",
    titleSub: null,
    body: "Từ ngôn tình lãng mạn đến trinh thám\ncăng thẳng — luôn có câu chuyện cho bạn.",
    pills: ["💕 Ngôn tình", "🔍 Trinh thám", "👻 Kinh dị", "🏛️ Lịch sử"],
    features: null,
    accentColor: "#FFD166",
  },
  {
    id: "features",
    kicker: "Tiện lợi mọi lúc",
    title: "Nghe không\ndừng được",
    titleSub: null,
    body: null,
    pills: null,
    features: [
      { icon: "🎧", label: "Phát nền", desc: "Nghe khi dùng app khác" },
      { icon: "📶", label: "Offline", desc: "Không cần mạng vẫn nghe" },
      { icon: "⚡", label: "Cập nhật hàng ngày", desc: "Tập mới mỗi sáng sớm" },
    ],
    accentColor: "#7ED6A7",
  },
];

export default function OnboardingScreen() {
  const { width: W } = useWindowDimensions();
  const isTablet = W >= 768;
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIndex(index);
  };

  const goNext = () => {
    if (activeIndex < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/");
  };

  const isLast = activeIndex === slides.length - 1;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        extraData={W}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        renderItem={({ item }) => <Slide slide={item} width={W} isTablet={isTablet} />}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaRow}>
        {!isLast && (
          <Pressable onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </Pressable>
        )}
        <Pressable
          onPress={isLast ? finish : goNext}
          style={[styles.nextBtn, isLast && styles.nextBtnFull]}
        >
          <Text style={styles.nextText}>
            {isLast ? "Bắt đầu nghe 🎧" : "Tiếp theo"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Slide({ slide, width, isTablet }: { slide: (typeof slides)[number]; width: number; isTablet: boolean }) {
  const slidePadH = isTablet ? Math.max(60, (width - 560) / 2) : 36;
  return (
    <View style={[styles.slide, { width, paddingHorizontal: slidePadH }]}>
      {slide.id === "welcome" && (
        <Image
          source={require("../assets/icon.png")}
          style={styles.icon}
          resizeMode="cover"
        />
      )}

      <Text style={styles.kicker}>{slide.kicker}</Text>

      <Text style={[styles.title, { color: slide.accentColor }]}>
        {slide.title}
      </Text>
      {slide.titleSub && (
        <Text style={styles.titleSub}>{slide.titleSub}</Text>
      )}

      {slide.body && <Text style={styles.body}>{slide.body}</Text>}

      {slide.pills && (
        <View style={styles.pillsRow}>
          {slide.pills.map((p) => (
            <View key={p} style={styles.pill}>
              <Text style={styles.pillText}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      {slide.features && (
        <View style={styles.featureList}>
          {slide.features.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 16,
  },
  icon: {
    borderRadius: 28,
    height: 96,
    marginBottom: 8,
    width: 96,
  },
  kicker: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 60,
  },
  titleSub: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: "700",
    marginTop: -8,
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  pill: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  featureList: {
    gap: 20,
    marginTop: 8,
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  featureIcon: {
    fontSize: 32,
    width: 44,
  },
  featureLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  featureDesc: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  dotsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 20,
  },
  dot: {
    backgroundColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: theme.colors.accent,
    width: 24,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  skipBtn: {
    alignItems: "center",
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  nextBtn: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    flex: 1,
    paddingVertical: 16,
  },
  nextBtnFull: {
    flex: 1,
  },
  nextText: {
    color: "#11131C",
    fontSize: 16,
    fontWeight: "700",
  },
});
