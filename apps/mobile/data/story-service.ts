import { nowPlaying as fallbackNowPlaying } from "../constants/mock-data";
import { fetchJson } from "../lib/api";

const episodeCache = new Map<string, { episode: Episode; expiresAt: number }>();
const EPISODE_CACHE_TTL_MS = 1000 * 60 * 15;

export type Episode = {
  id: string;
  title: string;
  episodeNumber?: number | null;
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
  slug?: string;
  title: string;
  summary: string | null;
  episodeNumber: number | null;
  audioUrl: string | null;
  durationSec: number | null;
  publishedAt: string | null;
  transcriptText?: string | null;
};

type ApiEpisodePreview = {
  id: string;
  title: string;
  episodeNumber: number | null;
};

type ApiStory = {
  id: string;
  slug?: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  status: "DRAFT" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  metadata: { mood?: string } | null;
  episodes: ApiEpisode[];
  totalEpisodes?: number;
};

type ApiStoryPreview = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  status: "DRAFT" | "ONGOING" | "COMPLETED" | "ARCHIVED";
  metadata: { mood?: string } | null;
  episodes: ApiEpisodePreview[];
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
  const latest = episodes[episodes.length - 1];
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
    episodeNumber: episode.episodeNumber,
    durationLabel: formatDurationLabel(episode.durationSec),
    publishedAt: formatPublishedAt(episode.publishedAt),
    summary: episode.summary ?? "",
    audioUrl: episode.audioUrl,
    transcriptText: episode.transcriptText ?? null
  };
}

function mapStory(story: ApiStory): StorySeries {
  const sortedEpisodes = [...story.episodes].sort((a, b) => {
    const episodeDiff = (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
    if (episodeDiff !== 0) {
      return episodeDiff;
    }

    return new Date(a.publishedAt ?? 0).getTime() - new Date(b.publishedAt ?? 0).getTime();
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

function mapPreviewEpisode(episode: ApiEpisodePreview): Episode {
  return {
    id: episode.id,
    title: episode.title,
    episodeNumber: episode.episodeNumber,
    durationLabel: episode.episodeNumber ? `Tập ${episode.episodeNumber}` : "Tập truyện",
    publishedAt: "Xem chi tiết",
    summary: "",
    audioUrl: null,
    transcriptText: null
  };
}

function mapPreviewStory(story: ApiStoryPreview): StorySeries {
  const sortedEpisodes = [...story.episodes].sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0));

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
    latestEpisodeLabel: formatLatestEpisodeLabel(
      sortedEpisodes.map((episode) => ({
        ...episode,
        summary: null,
        audioUrl: null,
        durationSec: null,
        publishedAt: null,
        transcriptText: null
      }))
    ),
    episodes: sortedEpisodes.map(mapPreviewEpisode)
  };
}

export async function loadStories(skip = 0, take = 20): Promise<{ stories: StorySeries[]; total: number }> {
  const data = await fetchJson<{ stories: ApiStoryPreview[]; total: number }>(`/api/mobile/stories?take=${take}&skip=${skip}`);
  return { stories: data.stories.map(mapPreviewStory), total: data.total };
}

export async function loadStoryById(id: string) {
  const data = await fetchJson<{ story: ApiStory }>(`/api/mobile/stories/${id}`);
  return mapStory(data.story);
}

export async function loadStoryEpisodes(storyId: string, skip = 0, take = 50): Promise<{ episodes: Episode[]; total: number }> {
  const data = await fetchJson<{ story: { episodes: ApiEpisode[]; totalEpisodes: number } }>(`/api/mobile/stories/${storyId}?episodesSkip=${skip}&episodesTake=${take}`);
  return { episodes: data.story.episodes.map(mapEpisode), total: data.story.totalEpisodes };
}

export async function loadEpisodeById(id: string) {
  const cached = episodeCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.episode;
  }

  const data = await fetchJson<{ episode: ApiEpisode }>(`/api/episodes/${id}`);
  const episode = mapEpisode(data.episode);
  episodeCache.set(id, {
    episode,
    expiresAt: Date.now() + EPISODE_CACHE_TTL_MS,
  });
  return episode;
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
