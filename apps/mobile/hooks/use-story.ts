import { useCallback, useEffect, useState } from "react";

import { loadStoryById, type StorySeries } from "../data/story-service";

export function useStory(id?: string) {
  const [story, setStory] = useState<StorySeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!id) {
      setStory(null);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const nextStory = await loadStoryById(id);
      setStory(nextStory);
    } catch (err) {
      setStory(null);
      setError(err instanceof Error ? err.message : "Không tải được series từ API.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

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

  return { story, isLoading, isRefreshing, error, refresh };
}
