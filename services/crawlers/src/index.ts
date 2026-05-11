import { sourceRegistry } from "./shared/source-registry";

console.log(
  JSON.stringify(
    {
      workspace: "@audio-story/crawlers",
      sourceCount: sourceRegistry.length,
      sources: sourceRegistry.map((adapter) => adapter.definition)
    },
    null,
    2
  )
);
