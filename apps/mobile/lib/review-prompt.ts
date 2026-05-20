import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_EPISODES_FINISHED = "bubu_episodes_finished_count";
const KEY_LAST_PROMPTED = "bubu_review_last_prompted";
const TRIGGER_AFTER_EPISODES = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 60;

export async function recordEpisodeFinished(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY_EPISODES_FINISHED);
    const count = Number(raw ?? "0") + 1;
    await AsyncStorage.setItem(KEY_EPISODES_FINISHED, String(count));

    if (count < TRIGGER_AFTER_EPISODES) return;

    const lastRaw = await AsyncStorage.getItem(KEY_LAST_PROMPTED);
    if (lastRaw) {
      const daysSince = (Date.now() - Number(lastRaw)) / (1000 * 60 * 60 * 24);
      if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StoreReview = require("expo-store-review") as typeof import("expo-store-review");
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    await AsyncStorage.setItem(KEY_LAST_PROMPTED, String(Date.now()));
    await StoreReview.requestReview();
  } catch {
    // never crash the player over this
  }
}
