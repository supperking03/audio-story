import { useEffect, useState } from "react";

import { loadStories, type StorySeries } from "../data/story-service";

export function useStories() {
  const [stories, setStories] = useState<StorySeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);
      const nextStories = await loadStories();

      if (isMounted) {
        setStories(nextStories);
        setIsLoading(false);
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  return { stories, isLoading };
}
