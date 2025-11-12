use crate::tag_manager::traits::Formats;

use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum FrameKey {
    Title,
    Artist,
    Album,
    Year,
    TrackNumber,
    Genre,
    AlbumArtist,
    AcoustidId,
    AcoustidFingerprint,
    AlbumArtistSort,
    AlbumSort,
    Arranger,
    ArtistSort,
    Artists,
    Asin,
    Barcode,
    CatalogNumber,
    Compilation,
    ComposerSort,
    Director,
    DiscNumber,
    DiscSubtitle,
    EncoderSettings,
    Engineer,
    Gapless,
    Grouping,
    InitialKey,
    Isrc,
    License,
    Lyricist,
    Lyrics,
    Media,
    Mixer,
    Mood,
    Movement,
    MovementTotal,
    MovementNumber,
    MusicBrainzArtistId,
    MusicBrainzDiscId,
    MusicBrainzOriginalArtistId,
    MusicBrainzOriginalAlbumId,
    MusicBrainzRecordingId,
    MusicBrainzAlbumArtistId,
    MusicBrainzReleaseGroupId,
    MusicBrainzAlbumId,
    MusicBrainzTrackId,
    MusicBrainzReleaseTrackId,
    MusicBrainzTrmId,
    MusicBrainzWorkId,
    MusicIpFingerprint,
    MusicIpPuid,
    OriginalAlbum,
    OriginalArtist,
    OriginalFilename,
    OriginalDate,
    OriginalYear,
    Performer,
    Podcast,
    PodcastUrl,
    Producer,
    Rating,
    Label,
    ReleaseCountry,
    ReleaseStatus,
    ReleaseType,
    Remixer,
    ReplayGainAlbumGain,
    ReplayGainAlbumPeak,
    ReplayGainAlbumRange,
    ReplayGainReferenceLoudness,
    ReplayGainTrackGain,
    ReplayGainTrackPeak,
    ReplayGainTrackRange,
    Script,
    Show,
    ShowSort,
    ShowMovement,
    Subtitle,
    TotalDiscs,
    TotalTracks,
    TitleSort,
    Website,
    Work,
    Writer,
    ContentGroup,
    Composer,
    EncodedBy,
    UnsyncedLyrics,
    Length,
    Conductor,
    AttachedPicture,
    UserDefinedURL,
    Comments,
    Private,
    RelativeVolumeAdjustment,
    EncryptionMethod,
    GroupIdRegistration,
    GeneralObject,
    CommercialURL,
    CopyrightURL,
    AudioFileURL,
    ArtistURL,
    RadioStationURL,
    PaymentURL,
    BitmapImageURL,
    UserDefinedText,
    SynchronizedLyrics,
    TempoCodes,
    MusicCDIdentifier,
    EventTimingCodes,
    Sequence,
    PlayCount,
    AudioSeekPointIndex,
    MediaType,
    CommercialFrame,
    AudioEncryption,
    SignatureFrame,
    SoftwareEncoder,
    AudioEncodingMethod,
    RecommendedBufferSize,
    BeatsPerMinute,
    Language,
    FileType,
    Time,
    RecordingDate,
    ReleaseDate,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum TagValue {
    Text(String),
    Picture {
        mime: String,
        data: Vec<u8>,
        picture_type: Option<u8>,
        description: Option<String>,
    },
    UserText(UserTextEntry),
    UserUrl(UserUrlEntry),
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct PictureData {
    pub mime: String,
    pub data: Vec<u8>,
    pub picture_type: Option<u8>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct UserTextEntry {
    pub description: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct UserUrlEntry {
    pub description: String,
    pub url: String,
}

pub type TagMap = HashMap<String, Vec<TagValue>>;

pub type RawTagMap = HashMap<String, Vec<u8>>;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct FreeformTag {
    pub mean: String,
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SerializableFile {
    pub path: String,
    pub tag_format: String,
    pub tag_formats: Vec<String>,
    pub tags: HashMap<String, Vec<SerializableTagValue>>,
    pub freeforms: Vec<SerializableFreeform>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Changes {
    pub paths: Vec<String>,
    pub tags: HashMap<FrameKey, Vec<SerializableTagValue>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableTagFrame {
    pub key: FrameKey,
    pub values: Vec<SerializableTagValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameChanges {
    pub paths: Vec<String>,
    pub frames: Vec<SerializableTagFrame>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum SerializableTagValue {
    Text(String),
    Picture {
        mime: String,
        data_base64: String,
        picture_type: Option<u8>,
        description: Option<String>,
    },
    UserText(UserTextEntry),
    UserUrl(UserUrlEntry),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializablePicture {
    pub mime: String,
    pub data_base64: String,
    pub picture_type: Option<u8>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableFreeform {
    pub mean: String,
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone)]
pub struct File {
    pub path: PathBuf,
    pub tags: HashMap<FrameKey, Vec<TagValue>>,
    pub tag_format: Formats,
    pub tag_formats: Vec<Formats>,
    pub freeforms: Vec<FreeformTag>,
}
impl fmt::Display for TagValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TagValue::Text(s) => write!(f, "{}", s),
            TagValue::Picture {
                mime,
                data,
                picture_type,
                description,
            } => {
                let t = picture_type
                    .map(|v| v.to_string())
                    .unwrap_or_else(|| "?".to_string());
                let desc = description.clone().unwrap_or_default();
                write!(
                    f,
                    "Picture (type {}, desc '{}', MIME: {}, {} bytes)",
                    t,
                    desc,
                    mime,
                    data.len()
                )
            }
            TagValue::UserText(ut) => write!(f, "{}={}", ut.description, ut.value),
            TagValue::UserUrl(uu) => write!(f, "{}={}", uu.description, uu.url),
        }
    }
}

impl fmt::Display for FrameKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            FrameKey::Title => "title",
            FrameKey::Artist => "artist",
            FrameKey::Album => "album",
            FrameKey::Year => "year",
            FrameKey::TrackNumber => "trackNumber",
            FrameKey::Genre => "genre",
            FrameKey::AlbumArtist => "albumArtist",
            FrameKey::AcoustidId => "acoustid_id",
            FrameKey::AcoustidFingerprint => "acoustid_fingerprint",
            FrameKey::AlbumArtistSort => "albumartistsort",
            FrameKey::AlbumSort => "albumsort",
            FrameKey::Arranger => "arranger",
            FrameKey::ArtistSort => "artistsort",
            FrameKey::Artists => "artists",
            FrameKey::Asin => "asin",
            FrameKey::Barcode => "barcode",
            FrameKey::CatalogNumber => "catalognumber",
            FrameKey::Compilation => "compilation",
            FrameKey::ComposerSort => "composersort",
            FrameKey::Director => "director",
            FrameKey::DiscNumber => "discnumber",
            FrameKey::DiscSubtitle => "discsubtitle",
            FrameKey::EncoderSettings => "encodersettings",
            FrameKey::Engineer => "engineer",
            FrameKey::Gapless => "gapless",
            FrameKey::Grouping => "grouping",
            FrameKey::InitialKey => "key",
            FrameKey::Isrc => "isrc",
            FrameKey::License => "license",
            FrameKey::Lyricist => "lyricist",
            FrameKey::Lyrics => "lyrics",
            FrameKey::Media => "media",
            FrameKey::Mixer => "mixer",
            FrameKey::Mood => "mood",
            FrameKey::Movement => "movement",
            FrameKey::MovementTotal => "movementtotal",
            FrameKey::MovementNumber => "movementnumber",
            FrameKey::MusicBrainzArtistId => "musicbrainz_artistid",
            FrameKey::MusicBrainzDiscId => "musicbrainz_discid",
            FrameKey::MusicBrainzOriginalArtistId => "musicbrainz_originalartistid",
            FrameKey::MusicBrainzOriginalAlbumId => "musicbrainz_originalalbumid",
            FrameKey::MusicBrainzRecordingId => "musicbrainz_recordingid",
            FrameKey::MusicBrainzAlbumArtistId => "musicbrainz_albumartistid",
            FrameKey::MusicBrainzReleaseGroupId => "musicbrainz_releasegroupid",
            FrameKey::MusicBrainzAlbumId => "musicbrainz_albumid",
            FrameKey::MusicBrainzTrackId => "musicbrainz_trackid",
            FrameKey::MusicBrainzReleaseTrackId => "musicbrainz_releasetrackid",
            FrameKey::MusicBrainzTrmId => "musicbrainz_trmid",
            FrameKey::MusicBrainzWorkId => "musicbrainz_workid",
            FrameKey::MusicIpFingerprint => "musicip_fingerprint",
            FrameKey::MusicIpPuid => "musicip_puid",
            FrameKey::OriginalAlbum => "originalalbum",
            FrameKey::OriginalArtist => "originalartist",
            FrameKey::OriginalFilename => "originalfilename",
            FrameKey::OriginalDate => "originaldate",
            FrameKey::OriginalYear => "originalyear",
            FrameKey::Performer => "performer",
            FrameKey::Podcast => "podcast",
            FrameKey::PodcastUrl => "podcasturl",
            FrameKey::Producer => "producer",
            FrameKey::Rating => "_rating",
            FrameKey::Label => "label",
            FrameKey::ReleaseCountry => "releasecountry",
            FrameKey::ReleaseStatus => "releasestatus",
            FrameKey::ReleaseType => "releasetype",
            FrameKey::Remixer => "remixer",
            FrameKey::ReplayGainAlbumGain => "replaygain_album_gain",
            FrameKey::ReplayGainAlbumPeak => "replaygain_album_peak",
            FrameKey::ReplayGainAlbumRange => "replaygain_album_range",
            FrameKey::ReplayGainReferenceLoudness => "replaygain_reference_loudness",
            FrameKey::ReplayGainTrackGain => "replaygain_track_gain",
            FrameKey::ReplayGainTrackPeak => "replaygain_track_peak",
            FrameKey::ReplayGainTrackRange => "replaygain_track_range",
            FrameKey::Script => "script",
            FrameKey::Show => "show",
            FrameKey::ShowSort => "showsort",
            FrameKey::ShowMovement => "showmovement",
            FrameKey::Subtitle => "subtitle",
            FrameKey::TotalDiscs => "totaldiscs",
            FrameKey::TotalTracks => "totaltracks",
            FrameKey::TitleSort => "titlesort",
            FrameKey::Website => "website",
            FrameKey::Work => "work",
            FrameKey::Writer => "writer",
            FrameKey::ContentGroup => "contentGroup",
            FrameKey::Composer => "composer",
            FrameKey::EncodedBy => "encodedBy",
            FrameKey::UnsyncedLyrics => "unsyncedLyrics",
            FrameKey::Length => "length",
            FrameKey::Conductor => "conductor",
            FrameKey::AttachedPicture => "attachedPicture",
            FrameKey::UserDefinedURL => "userDefinedUrl",
            FrameKey::Comments => "comments",
            FrameKey::Private => "private",
            FrameKey::RelativeVolumeAdjustment => "relativeVolumeAdjustment",
            FrameKey::EncryptionMethod => "encryptionMethod",
            FrameKey::GroupIdRegistration => "groupIdRegistration",
            FrameKey::GeneralObject => "generalObject",
            FrameKey::CommercialURL => "commercialUrl",
            FrameKey::CopyrightURL => "copyrightUrl",
            FrameKey::AudioFileURL => "audioFileUrl",
            FrameKey::ArtistURL => "artistUrl",
            FrameKey::RadioStationURL => "radioStationUrl",
            FrameKey::PaymentURL => "paymentUrl",
            FrameKey::BitmapImageURL => "bitmapImageUrl",
            FrameKey::UserDefinedText => "userDefinedText",
            FrameKey::SynchronizedLyrics => "synchronizedLyrics",
            FrameKey::TempoCodes => "tempoCodes",
            FrameKey::MusicCDIdentifier => "musicCdIdentifier",
            FrameKey::EventTimingCodes => "eventTimingCodes",
            FrameKey::Sequence => "sequence",
            FrameKey::PlayCount => "playCount",
            FrameKey::AudioSeekPointIndex => "audioSeekPointIndex",
            FrameKey::MediaType => "mediaType",
            FrameKey::CommercialFrame => "commercialFrame",
            FrameKey::AudioEncryption => "audioEncryption",
            FrameKey::SignatureFrame => "signatureFrame",
            FrameKey::SoftwareEncoder => "softwareEncoder",
            FrameKey::AudioEncodingMethod => "audioEncodingMethod",
            FrameKey::RecommendedBufferSize => "recommendedBufferSize",
            FrameKey::BeatsPerMinute => "beatsPerMinute",
            FrameKey::Language => "language",
            FrameKey::FileType => "fileType",
            FrameKey::Time => "time",
            FrameKey::RecordingDate => "recordingDate",
            FrameKey::ReleaseDate => "releaseDate",
        };
        write!(f, "{}", s)
    }
}

impl From<File> for SerializableFile {
    fn from(file: File) -> Self {
        let mut tags: HashMap<String, Vec<SerializableTagValue>> = HashMap::new();
        for (k, vals) in file.tags.into_iter() {
            let key = k.to_string();
            let mut out_vals: Vec<SerializableTagValue> = Vec::new();
            for v in vals {
                match v {
                    TagValue::Text(s) => out_vals.push(SerializableTagValue::Text(s)),
                    TagValue::Picture {
                        mime,
                        data,
                        picture_type,
                        description,
                    } => out_vals.push(SerializableTagValue::Picture {
                        mime,
                        data_base64: general_purpose::STANDARD.encode(data),
                        picture_type,
                        description,
                    }),
                    TagValue::UserText(item) => out_vals.push(SerializableTagValue::UserText(item)),
                    TagValue::UserUrl(item) => out_vals.push(SerializableTagValue::UserUrl(item)),
                }
            }
            tags.insert(key, out_vals);
        }

        SerializableFile {
            path: file.path.display().to_string(),
            tag_format: file.tag_format.to_string(),
            tag_formats: file
                .tag_formats
                .into_iter()
                .map(|f| f.to_string())
                .collect(),
            tags,
            freeforms: file
                .freeforms
                .into_iter()
                .map(|ff| SerializableFreeform {
                    mean: ff.mean,
                    name: ff.name,
                    value: ff.value,
                })
                .collect(),
        }
    }
}

pub fn is_multi_value(format: &Formats, key: FrameKey) -> bool {
    use Formats::*;
    match format {
        Id3v23 | Id3v24 => matches!(
            key,
            FrameKey::AttachedPicture
                | FrameKey::UserDefinedText
                | FrameKey::UserDefinedURL
                | FrameKey::Genre
                | FrameKey::Artist
                | FrameKey::Comments
        ),
        Itunes => matches!(
            key,
            FrameKey::AttachedPicture | FrameKey::Genre | FrameKey::Artist
        ),
        Flac | Vorbis => matches!(
            key,
            FrameKey::AttachedPicture | FrameKey::Genre | FrameKey::Artist | FrameKey::Comments
        ),
        Riff => matches!(key, FrameKey::AttachedPicture),
        Id3v22 => matches!(key, FrameKey::AttachedPicture),
        Id3v10 | Id3v11 | Unknown => false,
    }
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct TagFrame {
    pub key: FrameKey,
    pub values: Vec<TagValue>,
}

#[allow(dead_code)]
pub fn map_to_frames(map: &HashMap<FrameKey, Vec<TagValue>>) -> Vec<TagFrame> {
    map.iter()
        .map(|(k, v)| TagFrame {
            key: *k,
            values: v.clone(),
        })
        .collect()
}
