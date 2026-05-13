import { useEffect, useState } from "react";

import { loadStoryById, type StorySeries } from "../data/story-service";

export function useStory(id?: string) {
  const [story, setStory] = useState<StorySeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!id) {
        setStory(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextStory = await loadStoryById(id);

        if (isMounted) {
          setStory(nextStory);
        }
      } catch (err) {
        if (isMounted) {
          setStory(null);
          setError(err instanceof Error ? err.message : "Không tải được series từ API.");
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
  }, [id]);

  return { story, isLoading, error };
}
