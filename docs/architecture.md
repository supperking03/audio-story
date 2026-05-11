# Workspace Architecture

## Product split

- `apps/mobile`: listener-facing app
- `packages/db`: canonical schema for sources, normalized series, episodes, and progress
- `services/crawlers`: ingest pipeline that runs per source on its own schedule
- `services/api`: future serving layer between app and database

## Why split source data from app data

Source payloads are messy and change often. The app should only read normalized `StorySeries` and `Episode` records after content is reviewed or processed.

## Planned crawl flow

1. Trigger one source adapter on a cron schedule
2. Discover new series or episodes from that source
3. Store raw payloads in `RawContent`
4. Normalize into `StorySeries` and `Episode`
5. If source is audio-first, optionally generate transcript text
6. If source is text-first, optionally generate TTS audio
7. Publish only records that pass review or quality rules
