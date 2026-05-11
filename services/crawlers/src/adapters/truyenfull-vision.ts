import type { SourceAdapter } from "../shared/types";

export const truyenFullVisionAdapter: SourceAdapter = {
  definition: {
    key: "truyenfull-vision",
    name: "TruyenFull Vision",
    kind: "website",
    homepageUrl: "https://truyenfull.vision/hay-nham-mat-khi-anh-den-2-am-lan/",
    schedule: "0 */6 * * *",
    enabled: true,
    notes: "Scaffold only. Later: crawl chapter text and publish text-to-audio jobs."
  },
  async discover() {
    return [
      {
        externalId: "hay-nham-mat-khi-anh-den-2-am-lan",
        title: "Hãy Nhắm Mắt Khi Anh Đến - Ám Lân",
        sourceUrl: "https://truyenfull.vision/hay-nham-mat-khi-anh-den-2-am-lan/",
        description:
          "Website source scaffold. Future pipeline can fetch chapter lists, normalize text, and create TTS jobs.",
        episodes: []
      }
    ];
  }
};
