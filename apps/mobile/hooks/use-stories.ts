import { useCallback, useEffect, useRef, useState } from "react";

import { loadStories, type StorySeries } from "../data/story-service";

const PAGE_SIZE = 20;

export function useStories() {
  const [stories, setStories] = useState<StorySeries[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipRef = useRef(0);

  const load = useCallback(async (skip: number, silent = false, append = false) => {
    if (skip === 0 && !silent) setIsLoading(true);
    if (skip === 0 && silent) setIsRefreshing(true);
    if (skip > 0) setIsLoadingMore(true);
    setError(null);
    try {
      const result = await loadStories(skip, PAGE_SIZE);
      setTotal(result.total);
      setStories((prev) => append ? [...prev, ...result.stories] : result.stories);
      skipRef.current = skip + result.stories.length;
    } catch (err) {
      if (!append) setStories([]);
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu từ API.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  const refresh = useCallback(() => load(0, true), [load]);
  const loadMore = useCallback(() => {
    if (isLoadingMore || isLoading || stories.length >= total) return;
    load(skipRef.current, false, true);
  }, [isLoadingMore, isLoading, stories.length, total, load]);

  return { stories, total, isLoading, isRefreshing, isLoadingMore, error, refresh, loadMore };
}
