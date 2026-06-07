import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export type PlayerMeta = {
  episodeId: string;
  episodeTitle: string;
  seriesId: string;
  seriesTitle: string;
  coverColor: [string, string];
  coverImageUrl?: string | null;
} | null;

type PlayerContextValue = {
  meta: PlayerMeta;
  setMeta: (meta: PlayerMeta) => void;
  remoteNextRef: React.MutableRefObject<(() => void) | null>;
  remotePrevRef: React.MutableRefObject<(() => void) | null>;
};

const PlayerContext = createContext<PlayerContextValue>({
  meta: null,
  setMeta: () => {},
  remoteNextRef: { current: null },
  remotePrevRef: { current: null },
});

export function PlayerMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PlayerMeta>(null);
  const remoteNextRef = useRef<(() => void) | null>(null);
  const remotePrevRef = useRef<(() => void) | null>(null);
  return (
    <PlayerContext.Provider value={{ meta, setMeta, remoteNextRef, remotePrevRef }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerMeta() {
  return useContext(PlayerContext);
}
