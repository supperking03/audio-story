export type Episode = {
  id: string;
  title: string;
  durationLabel: string;
  publishedAt: string;
  summary: string;
};

export type StorySeries = {
  id: string;
  title: string;
  author: string;
  coverColor: [string, string];
  mood: string;
  description: string;
  tags: string[];
  status: "Ongoing" | "Completed";
  latestEpisodeLabel: string;
  episodes: Episode[];
};

export const featuredSeries: StorySeries[] = [
  {
    id: "hay-nham-mat-khi-anh-den",
    title: "Hãy Nhắm Mắt Khi Anh Đến",
    author: "Đinh Mặc",
    coverColor: ["#5F0F40", "#FB8B24"],
    mood: "Trinh thám lãng mạn",
    description:
      "Một series ngôn tình nhịp nhanh, giàu kịch tính, hợp với trải nghiệm nghe liên tục như podcast.",
    tags: ["Suspense", "Ngọt", "Dài tập"],
    status: "Ongoing",
    latestEpisodeLabel: "Tập 42",
    episodes: [
      {
        id: "ep-42",
        title: "Tập 42: Dấu vết còn lại",
        durationLabel: "28 phút",
        publishedAt: "Hôm nay",
        summary: "Bối cảnh tiếp tục được đẩy nhanh với một manh mối mở rộng hơn."
      },
      {
        id: "ep-41",
        title: "Tập 41: Ánh đèn cuối hành lang",
        durationLabel: "31 phút",
        publishedAt: "Hôm qua",
        summary: "Nhịp kể chậm lại để xây tâm lý trước một cú mở lớn."
      },
      {
        id: "ep-40",
        title: "Tập 40: Cuộc gọi lúc nửa đêm",
        durationLabel: "26 phút",
        publishedAt: "2 ngày trước",
        summary: "Một tập cliffhanger rất hợp cho nhóm người nghe theo series."
      }
    ]
  },
  {
    id: "co-dai-cung-chieu",
    title: "Cổ Đại Sủng Ngọt",
    author: "Tổng hợp từ kênh audio",
    coverColor: ["#1D3557", "#E63946"],
    mood: "Cổ đại chữa lành",
    description:
      "Playlist nghe trước giờ ngủ, tập trung vào những truyện cổ đại nhẹ, dễ vào và dễ binge.",
    tags: ["Cổ đại", "Sủng", "Nghe trước khi ngủ"],
    status: "Ongoing",
    latestEpisodeLabel: "Tập 18",
    episodes: [
      {
        id: "ep-18",
        title: "Tập 18: Trăng rơi bên hiên",
        durationLabel: "21 phút",
        publishedAt: "Hôm nay",
        summary: "Một tập ngắn, rất phù hợp block nghe thư giãn."
      },
      {
        id: "ep-17",
        title: "Tập 17: Lời hẹn dưới mưa",
        durationLabel: "24 phút",
        publishedAt: "3 ngày trước",
        summary: "Điểm rơi cảm xúc tốt, dễ kéo listener quay lại."
      }
    ]
  },
  {
    id: "tong-tai-nghien-vo",
    title: "Tổng Tài Nghiện Vợ",
    author: "Kênh audio tuyển chọn",
    coverColor: ["#2A2A72", "#009FFD"],
    mood: "Tổng tài hiện đại",
    description: "Series hiện đại, nhịp nhanh và hợp nghe theo tập ngắn.",
    tags: ["Tổng tài", "Hiện đại", "HE"],
    status: "Ongoing",
    latestEpisodeLabel: "Tập 25",
    episodes: [
      {
        id: "ep-25",
        title: "Tập 25: Không thể buông tay",
        durationLabel: "19 phút",
        publishedAt: "Hôm nay",
        summary: "Một tập ngắn, nhịp cảm xúc dồn và dễ vào."
      },
      {
        id: "ep-24",
        title: "Tập 24: Gặp lại nơi cũ",
        durationLabel: "22 phút",
        publishedAt: "Hôm qua",
        summary: "Tập đẩy nhanh quan hệ nhân vật và tạo hook nghe tiếp."
      }
    ]
  }
];

export const browseTerms = [
  "Ngọt sâu",
  "Cổ đại",
  "Tổng tài",
  "HE",
  "Nghe trước ngủ",
  "Trinh thám",
  "Dài tập",
  "Hot hôm nay"
];

export const nowPlaying = {
  seriesId: "hay-nham-mat-khi-anh-den",
  episodeId: "ep-41",
  title: "Hãy Nhắm Mắt Khi Anh Đến",
  episodeTitle: "Tập 41: Ánh đèn cuối hành lang",
  progress: 0.68,
  remainingLabel: "Còn 9 phút"
};

export function getSeriesById(seriesId: string) {
  return featuredSeries.find((series) => series.id === seriesId);
}

export function getEpisodeById(seriesId: string, episodeId: string) {
  return getSeriesById(seriesId)?.episodes.find((episode) => episode.id === episodeId);
}

export function searchSeries(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return featuredSeries;
  }

  return featuredSeries.filter((series) => {
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
