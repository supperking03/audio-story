import { createContext, useContext, useState, type ReactNode } from "react";

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
};

const PlayerContext = createContext<PlayerContextValue>({ meta: null, setMeta: () => {} });

export function PlayerMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PlayerMeta>(null);
  return <PlayerContext.Provider value={{ meta, setMeta }}>{children}</PlayerContext.Provider>;
}

export function usePlayerMeta() {
  return useContext(PlayerContext);
}
