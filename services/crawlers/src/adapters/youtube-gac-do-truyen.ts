import type { SourceAdapter } from "../shared/types";

export const gacDocTruyenYoutubeAdapter: SourceAdapter = {
  definition: {
    key: "youtube-gac-doc-truyen",
    name: "Gác Đọc Truyện - YouTube",
    kind: "youtube",
    homepageUrl: "https://www.youtube.com/@GacDocTruyen-Ng%C3%B4nt%C3%ACnh-C%E1%BB%95%C4%91%E1%BA%A1i",
    schedule: "0 */4 * * *",
    enabled: true,
    notes: "Scaffold only. Later: fetch video metadata, extract audio, and optionally transcribe to text."
  },
  async discover() {
    return [
      {
        externalId: "channel-gac-doc-truyen",
        title: "Gác Đọc Truyện",
        sourceUrl: "https://www.youtube.com/@GacDocTruyen-Ng%C3%B4nt%C3%ACnh-C%E1%BB%95%C4%91%E1%BA%A1i",
        description:
          "YouTube channel scaffold. Future pipeline can detect new uploads and route audio/transcript processing.",
        episodes: []
      }
    ];
  }
};
