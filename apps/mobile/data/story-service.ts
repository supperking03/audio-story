import { nowPlaying as fallbackNowPlaying } from "../constants/mock-data";
import { fetchJson } from "../lib/api";

export type Episode = {
  id: string;
  title: string;
  durationLabel: string;
  publishedAt: string;
  summary: string;
  audioUrl?: string | null;
  transcriptText?: string | null;
};

export type StorySeries = {
  id: string;
  title: string;
  author: string;
  coverColor: [string, string];
  coverImageUrl?: string | null;
  mood: string;
  description: string;
  tags: string[];
  status: "Ongoing" | "Completed";
  latestEpisodeLabel: string;
  episodes: Episode[];
};

type ApiEpisode = {
  id: string;
  title: string;
  summary: string | null;
  episodeNumber: number | null;
  audioUrl: string | null;
  durationSec: number | null;
  publishedAt: string | null;
  transcriptText: string | null;
};

type ApiStory = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  status: "DRAFT" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  metadata: { mood?: string } | null;
  episodes: ApiEpisode[];
};

const gradients: [string, string][] = [
  ["#5F0F40", "#FB8B24"],
  ["#1D3557", "#E63946"],
  ["#2A2A72", "#009FFD"],
  ["#3A0CA3", "#F72585"],
  ["#0B6E4F", "#D9ED92"]
];

function hashIndex(value: string) {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
}

function formatPublishedAt(value: string | null) {
  if (!value) {
    return "Mới cập nhật";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Mới cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatDurationLabel(durationSec: number | null) {
  if (!durationSec || durationSec <= 0) {
    return "Chưa rõ";
  }

  const minutes = Math.max(1, Math.round(durationSec / 60));
  return `${minutes} phút`;
}

function formatLatestEpisodeLabel(episodes: ApiEpisode[]) {
  const latest = episodes[0];
  if (!latest) {
    return "Chưa có tập";
  }

  if (latest.episodeNumber) {
    return `Tập ${latest.episodeNumber}`;
  }

  return "Mới nhất";
}

function mapEpisode(episode: ApiEpisode): Episode {
  return {
    id: episode.id,
    title: episode.title,
    durationLabel: formatDurationLabel(episode.durationSec),
    publishedAt: formatPublishedAt(episode.publishedAt),
    summary: episode.summary ?? "",
    audioUrl: episode.audioUrl,
    transcriptText: episode.transcriptText
  };
}

function mapStory(story: ApiStory): StorySeries {
  const sortedEpisodes = [...story.episodes].sort((a, b) => {
    const episodeDiff = (b.episodeNumber ?? 0) - (a.episodeNumber ?? 0);
    if (episodeDiff !== 0) {
      return episodeDiff;
    }

    return new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime();
  });

  return {
    id: story.id,
    title: story.title,
    author: story.author ?? "Chưa cập nhật",
    coverColor: gradients[hashIndex(story.id)],
    coverImageUrl: story.coverImageUrl,
    mood: story.metadata?.mood ?? story.tags[0] ?? "Truyện audio",
    description: story.description ?? "",
    tags: story.tags,
    status: story.status === "COMPLETED" ? "Completed" : "Ongoing",
    latestEpisodeLabel: formatLatestEpisodeLabel(sortedEpisodes),
    episodes: sortedEpisodes.map(mapEpisode)
  };
}

export async function loadStories() {
  const data = await fetchJson<{ stories: ApiStory[] }>("/api/stories");
  return data.stories.map(mapStory);
}

export async function loadStoryById(id: string) {
  const data = await fetchJson<{ story: ApiStory }>(`/api/stories/${id}`);
  return mapStory(data.story);
}

export function searchSeries(seriesList: StorySeries[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return seriesList;
  }

  return seriesList.filter((series) => {
    const haystack = [
      series.title,
      series.author,
      series.mood,
      ...series.tags,
      ...series.episodes.map((episode) => episode.title)
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function getFallbackNowPlaying() {
  return fallbackNowPlaying;
}
