import type { SourceAdapter } from "../shared/types";

export async function runSource(adapter: SourceAdapter) {
  const startedAt = new Date().toISOString();
  const series = await adapter.discover();

  return {
    source: adapter.definition.key,
    startedAt,
    finishedAt: new Date().toISOString(),
    discoveredSeriesCount: series.length,
    series
  };
}
