import { useEffect, useState } from "react";

import { loadStories, type StorySeries } from "../data/story-service";

export function useStories() {
  const [stories, setStories] = useState<StorySeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const nextStories = await loadStories();

        if (isMounted) {
          setStories(nextStories);
        }
      } catch (err) {
        if (isMounted) {
          setStories([]);
          setError(err instanceof Error ? err.message : "Không tải được dữ liệu từ API.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  return { stories, isLoading, error };
}
