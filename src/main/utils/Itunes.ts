export const itunesMapping = {
  title: "©nam",
  artist: "©ART",
  album: "©alb",
  year: "©day",
  trackNumber: "trkn",
  genre: "©gen",
  albumArtist: "aART",
  contentGroup: "©grp",
  composer: "©wrt",
  encodedBy: "©too",
  lyrics: "©lyr",
  length: "©len",
  conducter: "cond",
  attachedPicture: "covr",
  userDefinedUrl: "©url",
  comments: "©cmt",
  bpm: "tmpo",
  diskNumber: "disk",
};

const itunesTagsKeys = Object.values(itunesMapping) as (keyof typeof itunesMapping)[];

export const itunesTags = itunesTagsKeys.reduce(
  (acc, key) => ({
    ...acc,
    [key]: "",
  }),
  {}
);
export const itunesReverseMapping: Record<string, string> = Object.fromEntries(
  Object.entries(itunesMapping).map(([readable, original]) => [original, readable])
);
