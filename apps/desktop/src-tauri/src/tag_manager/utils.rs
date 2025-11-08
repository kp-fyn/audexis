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
    Picture { mime: String, data: Vec<u8> },
}

pub type TagMap = HashMap<String, TagValue>;

pub type RawTagMap = HashMap<String, Vec<u8>>;

#[derive(Debug, Clone, Serialize)]
pub struct SerializableFile {
    pub path: String,
    pub tag_format: String,
    pub tags: HashMap<String, SerializableTagValue>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Changes {
    pub paths: Vec<String>,
    pub tags: HashMap<FrameKey, SerializableTagValue>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum SerializableTagValue {
    Text(String),
    Picture { mime: String, data_base64: String },
}

#[derive(Debug, Clone)]
pub struct File {
    pub path: PathBuf,
    pub tags: HashMap<FrameKey, TagValue>,
    pub tag_format: Formats,
}
impl fmt::Display for TagValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TagValue::Text(s) => write!(f, "{}", s),
            TagValue::Picture { mime, data } => {
                write!(f, "Picture (MIME: {}, {} bytes)", mime, data.len())
            }
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
        let tags = file
            .tags
            .into_iter()
            .map(|(k, v)| {
                let key = k.to_string();
                let value = match v {
                    TagValue::Text(s) => SerializableTagValue::Text(s),
                    TagValue::Picture { mime, data } => SerializableTagValue::Picture {
                        mime,
                        data_base64: general_purpose::STANDARD.encode(data),
                    },
                };
                (key, value)
            })
            .collect();

        SerializableFile {
            path: file.path.display().to_string(),
            tag_format: file.tag_format.to_string(),
            tags,
        }
    }
}
