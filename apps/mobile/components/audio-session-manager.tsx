import { useEffect } from "react";

import { ensureTrackPlayerSetup } from "../lib/track-player";

export function AudioSessionManager() {
  useEffect(() => {
    ensureTrackPlayerSetup().catch((error) => {
      console.error("[track-player] setup failed:", error);
    });
  }, []);

  return null;
}
