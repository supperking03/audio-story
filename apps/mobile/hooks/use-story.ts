import { useEffect, useState } from "react";

import { loadStoryById, type StorySeries } from "../data/story-service";

export function useStory(id?: string) {
  const [story, setStory] = useState<StorySeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!id) {
        setStory(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const nextStory = await loadStoryById(id);

      if (isMounted) {
        setStory(nextStory);
        setIsLoading(false);
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { story, isLoading };
}
