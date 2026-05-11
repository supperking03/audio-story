export const schemaNotes = {
  intent:
    "The schema separates source ingestion from app-facing series and episodes so content can be normalized before publish.",
  sourceKinds: ["WEBSITE", "YOUTUBE_CHANNEL", "YOUTUBE_PLAYLIST", "RSS", "MANUAL"],
  processingStages: ["RAW", "NORMALIZED", "AUDIO_READY", "TEXT_READY", "PUBLISHED", "REJECTED"]
} as const;
