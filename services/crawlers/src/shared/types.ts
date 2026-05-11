export type SourceAdapterKind = "website" | "youtube";

export type SourceDefinition = {
  key: string;
  name: string;
  kind: SourceAdapterKind;
  homepageUrl: string;
  schedule: string;
  enabled: boolean;
  notes?: string;
};

export type DiscoveredEpisode = {
  externalId: string;
  title: string;
  sourceUrl: string;
  publishedAt?: string;
  rawText?: string;
  rawAudioUrl?: string;
};

export type DiscoveredSeries = {
  externalId: string;
  title: string;
  sourceUrl: string;
  description?: string;
  episodes: DiscoveredEpisode[];
};

export interface SourceAdapter {
  definition: SourceDefinition;
  discover(): Promise<DiscoveredSeries[]>;
}
