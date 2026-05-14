import { useCallback, useEffect, useState } from "react";

import { loadStories, type StorySeries } from "../data/story-service";

export function useStories() {
  const [stories, setStories] = useState<StorySeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const nextStories = await loadStories();
      setStories(nextStories);
    } catch (err) {
      setStories([]);
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu từ API.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    refresh().catch(() => {
      if (!isMounted) {
        return;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  return { stories, isLoading, isRefreshing, error, refresh };
}
