import { sourceRegistry } from "../shared/source-registry";
import { runSource } from "../pipeline/run-source";

async function main() {
  const enabledSources = sourceRegistry.filter((adapter) => adapter.definition.enabled);
  const results = await Promise.all(enabledSources.map((adapter) => runSource(adapter)));

  console.log(JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2));
}

main().catch((error) => {
  console.error("Daily crawl failed", error);
  process.exitCode = 1;
});
