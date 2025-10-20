use crate::tag_manager::utils::FrameKey;
use crate::tag_manager::utils::TagValue;
use once_cell::sync::Lazy;
use std::collections::HashMap;

pub fn id3v23_code(key: FrameKey) -> &'static str {
    match key {
        FrameKey::Title => "TIT2",
        FrameKey::Artist => "TPE1",
        FrameKey::Album => "TALB",
        FrameKey::Year => "TYER",
        FrameKey::TrackNumber => "TRCK",
        FrameKey::Genre => "TCON",
        FrameKey::AlbumArtist => "TPE2",
        FrameKey::ContentGroup => "TIT1",
        FrameKey::Composer => "TCOM",
        FrameKey::EncodedBy => "TENC",
        FrameKey::UnsyncedLyrics => "USLT",
        FrameKey::Length => "TLEN",
        FrameKey::Conductor => "TPE3",
        FrameKey::AttachedPicture => "APIC",
        FrameKey::UserDefinedURL => "WXXX",
        FrameKey::Comments => "COMM",
        FrameKey::Private => "PRIV",
        FrameKey::RelativeVolumeAdjustment => "RVA2",
        FrameKey::EncryptionMethod => "ENCR",
        FrameKey::GroupIdRegistration => "GRID",
        FrameKey::GeneralObject => "GEOB",
        FrameKey::CommercialURL => "WCOM",
        FrameKey::CopyrightURL => "WCOP",
        FrameKey::AudioFileURL => "WOAF",
        FrameKey::ArtistURL => "WOAR",
        FrameKey::RadioStationURL => "WORS",
        FrameKey::PaymentURL => "WPAY",
        FrameKey::BitmapImageURL => "WBMP",
        FrameKey::UserDefinedText => "TXXX",
        FrameKey::SynchronizedLyrics => "SYLT",
        FrameKey::TempoCodes => "SYTC",
        FrameKey::MusicCDIdentifier => "MCDI",
        FrameKey::EventTimingCodes => "ETCO",
        FrameKey::Sequence => "SEQU",
        FrameKey::PlayCount => "PCNT",
        FrameKey::AudioSeekPointIndex => "ASPI",
        FrameKey::MediaType => "STIK",
        FrameKey::CommercialFrame => "COMR",
        FrameKey::AudioEncryption => "AENC",
        FrameKey::SignatureFrame => "SIGN",
        FrameKey::SoftwareEncoder => "TSSE",
        FrameKey::AudioEncodingMethod => "CART",
        FrameKey::RecommendedBufferSize => "RBUF",
        FrameKey::BeatsPerMinute => "TBPM",
        FrameKey::Language => "TLAN",
        FrameKey::FileType => "TFLT",
        FrameKey::Time => "TIME",
        FrameKey::RecordingDate => "TDRC",
        FrameKey::ReleaseDate => "TDOR",
    }
}

pub fn id3v22_code(key: FrameKey) -> &'static str {
    match key {
        FrameKey::Title => "TT2",           // Title/Songname/Content description
        FrameKey::Artist => "TP1",          // Lead performer(s)/Soloist(s)
        FrameKey::Album => "TAL",           // Album/Movie/Show title
        FrameKey::Year => "TYE",            // Year
        FrameKey::TrackNumber => "TRK",     // Track number/Position in set
        FrameKey::Genre => "TCO",           // Content type
        FrameKey::AlbumArtist => "TP2",     // Band/orchestra/accompaniment
        FrameKey::ContentGroup => "TIT",    // Content group description (approximation)
        FrameKey::Composer => "TCM",        // Composer
        FrameKey::EncodedBy => "TEN",       // Encoded by
        FrameKey::UnsyncedLyrics => "ULT",  // Unsynchronized lyric/text transcription
        FrameKey::Length => "TLE",          // Length
        FrameKey::Conductor => "TP3",       // Conductor/performer refinement
        FrameKey::AttachedPicture => "PIC", // Attached picture (different structure)
        // For frames without direct v2.2 counterparts we provide placeholders so they won't be written.
        FrameKey::UserDefinedURL => "WXX", // Not really existing in v2.2; placeholder.
        FrameKey::Comments => "COM",       // Comments
        FrameKey::Private => "PRIV",       // No direct v2.2, placeholder
        FrameKey::RelativeVolumeAdjustment => "RVA", // v2.2 uses RVA
        FrameKey::EncryptionMethod => "CRM", // Encrypted meta frame (approx)
        FrameKey::GroupIdRegistration => "GRID", // Placeholder
        FrameKey::GeneralObject => "GEOB", // Placeholder
        FrameKey::CommercialURL => "WCM",  // Commercial information
        FrameKey::CopyrightURL => "WCP",   // Copyright/Legal information
        FrameKey::AudioFileURL => "WAF",   // Official audio file webpage
        FrameKey::ArtistURL => "WAR",      // Official artist/performer webpage
        FrameKey::RadioStationURL => "WORS", // Placeholder
        FrameKey::PaymentURL => "WPAY",    // Placeholder
        FrameKey::BitmapImageURL => "WBMP", // Placeholder
        FrameKey::UserDefinedText => "TXX", // User defined text (approx)
        FrameKey::SynchronizedLyrics => "SLT", // Synchronized lyric/text
        FrameKey::TempoCodes => "STC",     // Placeholder
        FrameKey::MusicCDIdentifier => "MCI", // Music CD Identifier
        FrameKey::EventTimingCodes => "ETC", // Event timing codes
        FrameKey::Sequence => "SEQ",       // Placeholder
        FrameKey::PlayCount => "CNT",      // Play counter
        FrameKey::AudioSeekPointIndex => "ASPI", // Placeholder
        FrameKey::MediaType => "STIK",     // Placeholder
        FrameKey::CommercialFrame => "COMR", // Placeholder
        FrameKey::AudioEncryption => "AENC", // Placeholder
        FrameKey::SignatureFrame => "SIGN", // Placeholder
        FrameKey::SoftwareEncoder => "TSS", // Software/Hardware and settings used for encoding
        FrameKey::AudioEncodingMethod => "CART", // Placeholder
        FrameKey::RecommendedBufferSize => "RBUF", // Placeholder
        FrameKey::BeatsPerMinute => "TBP", // BPM (approx TBPM)
        FrameKey::Language => "TLA",       // Language(s)
        FrameKey::FileType => "TFT",       // File type
        FrameKey::Time => "TIM",           // Time
        FrameKey::RecordingDate => "TRD",  // Recording dates (approx)
        FrameKey::ReleaseDate => "TRD",    // Approx reuse
    }
}

pub fn id3v24_code(key: FrameKey) -> &'static str {
    match key {
        FrameKey::Year => "TDRC",
        FrameKey::ReleaseDate => "TDOR",
        other => id3v23_code(other),
    }
}

pub static ID3V23_REVERSE_MAP: Lazy<HashMap<&'static str, FrameKey>> = Lazy::new(|| {
    let mut map = HashMap::new();
    for key in [
        FrameKey::Title,
        FrameKey::Artist,
        FrameKey::Album,
        FrameKey::Year,
        FrameKey::TrackNumber,
        FrameKey::Genre,
        FrameKey::AlbumArtist,
        FrameKey::ContentGroup,
        FrameKey::Composer,
        FrameKey::EncodedBy,
        FrameKey::UnsyncedLyrics,
        FrameKey::Length,
        FrameKey::Conductor,
        FrameKey::AttachedPicture,
        FrameKey::UserDefinedURL,
        FrameKey::Comments,
        FrameKey::Private,
        FrameKey::RelativeVolumeAdjustment,
        FrameKey::EncryptionMethod,
        FrameKey::GroupIdRegistration,
        FrameKey::GeneralObject,
        FrameKey::CommercialURL,
        FrameKey::CopyrightURL,
        FrameKey::AudioFileURL,
        FrameKey::ArtistURL,
        FrameKey::RadioStationURL,
        FrameKey::PaymentURL,
        FrameKey::BitmapImageURL,
        FrameKey::UserDefinedText,
        FrameKey::SynchronizedLyrics,
        FrameKey::TempoCodes,
        FrameKey::MusicCDIdentifier,
        FrameKey::EventTimingCodes,
        FrameKey::Sequence,
        FrameKey::PlayCount,
        FrameKey::AudioSeekPointIndex,
        FrameKey::MediaType,
        FrameKey::CommercialFrame,
        FrameKey::AudioEncryption,
        FrameKey::SignatureFrame,
        FrameKey::SoftwareEncoder,
        FrameKey::AudioEncodingMethod,
        FrameKey::RecommendedBufferSize,
        FrameKey::BeatsPerMinute,
        FrameKey::Language,
        FrameKey::FileType,
        FrameKey::Time,
        FrameKey::RecordingDate,
        FrameKey::ReleaseDate,
    ] {
        map.insert(id3v23_code(key), key);
    }
    map
});

pub static ID3V22_REVERSE_MAP: Lazy<HashMap<&'static str, FrameKey>> = Lazy::new(|| {
    let mut map = HashMap::new();
    for key in [
        FrameKey::Title,
        FrameKey::Artist,
        FrameKey::Album,
        FrameKey::Year,
        FrameKey::TrackNumber,
        FrameKey::Genre,
        FrameKey::AlbumArtist,
        FrameKey::ContentGroup,
        FrameKey::Composer,
        FrameKey::EncodedBy,
        FrameKey::UnsyncedLyrics,
        FrameKey::Length,
        FrameKey::Conductor,
        FrameKey::AttachedPicture,
        FrameKey::UserDefinedURL,
        FrameKey::Comments,
        FrameKey::Private,
        FrameKey::RelativeVolumeAdjustment,
        FrameKey::EncryptionMethod,
        FrameKey::GroupIdRegistration,
        FrameKey::GeneralObject,
        FrameKey::CommercialURL,
        FrameKey::CopyrightURL,
        FrameKey::AudioFileURL,
        FrameKey::ArtistURL,
        FrameKey::RadioStationURL,
        FrameKey::PaymentURL,
        FrameKey::BitmapImageURL,
        FrameKey::UserDefinedText,
        FrameKey::SynchronizedLyrics,
        FrameKey::TempoCodes,
        FrameKey::MusicCDIdentifier,
        FrameKey::EventTimingCodes,
        FrameKey::Sequence,
        FrameKey::PlayCount,
        FrameKey::AudioSeekPointIndex,
        FrameKey::MediaType,
        FrameKey::CommercialFrame,
        FrameKey::AudioEncryption,
        FrameKey::SignatureFrame,
        FrameKey::SoftwareEncoder,
        FrameKey::AudioEncodingMethod,
        FrameKey::RecommendedBufferSize,
        FrameKey::BeatsPerMinute,
        FrameKey::Language,
        FrameKey::FileType,
        FrameKey::Time,
        FrameKey::RecordingDate,
        FrameKey::ReleaseDate,
    ] {
        map.insert(id3v22_code(key), key);
    }
    map
});

pub static ID3V24_REVERSE_MAP: Lazy<HashMap<&'static str, FrameKey>> = Lazy::new(|| {
    let mut map = HashMap::new();
    for key in [
        FrameKey::Title,
        FrameKey::Artist,
        FrameKey::Album,
        FrameKey::Year,
        FrameKey::TrackNumber,
        FrameKey::Genre,
        FrameKey::AlbumArtist,
        FrameKey::ContentGroup,
        FrameKey::Composer,
        FrameKey::EncodedBy,
        FrameKey::UnsyncedLyrics,
        FrameKey::Length,
        FrameKey::Conductor,
        FrameKey::AttachedPicture,
        FrameKey::UserDefinedURL,
        FrameKey::Comments,
        FrameKey::Private,
        FrameKey::RelativeVolumeAdjustment,
        FrameKey::EncryptionMethod,
        FrameKey::GroupIdRegistration,
        FrameKey::GeneralObject,
        FrameKey::CommercialURL,
        FrameKey::CopyrightURL,
        FrameKey::AudioFileURL,
        FrameKey::ArtistURL,
        FrameKey::RadioStationURL,
        FrameKey::PaymentURL,
        FrameKey::BitmapImageURL,
        FrameKey::UserDefinedText,
        FrameKey::SynchronizedLyrics,
        FrameKey::TempoCodes,
        FrameKey::MusicCDIdentifier,
        FrameKey::EventTimingCodes,
        FrameKey::Sequence,
        FrameKey::PlayCount,
        FrameKey::AudioSeekPointIndex,
        FrameKey::MediaType,
        FrameKey::CommercialFrame,
        FrameKey::AudioEncryption,
        FrameKey::SignatureFrame,
        FrameKey::SoftwareEncoder,
        FrameKey::AudioEncodingMethod,
        FrameKey::RecommendedBufferSize,
        FrameKey::BeatsPerMinute,
        FrameKey::Language,
        FrameKey::FileType,
        FrameKey::Time,
        FrameKey::RecordingDate,
        FrameKey::ReleaseDate,
    ] {
        map.insert(id3v24_code(key), key);
    }
    map
});

pub fn raw_to_tags(raw: &HashMap<String, TagValue>) -> HashMap<FrameKey, TagValue> {
    let mut result = HashMap::new();

    for key in ID3V23_REVERSE_MAP.values() {
        let id3_key = id3v23_code(*key);
        let value = raw
            .get(id3_key)
            .cloned()
            .unwrap_or_else(|| TagValue::Text(String::new()));
        result.insert(*key, value);
    }

    result
}
pub fn tags_to_raw(tags: &HashMap<FrameKey, TagValue>) -> HashMap<&'static str, TagValue> {
    tags.iter()
        .map(|(key, value)| (id3v23_code(*key), value.clone()))
        .collect()
}
pub fn id3v22_raw_to_tags(raw: &HashMap<String, TagValue>) -> HashMap<FrameKey, TagValue> {
    let mut result = HashMap::new();
    for key in ID3V22_REVERSE_MAP.values() {
        let id = id3v22_code(*key);
        let value = raw
            .get(id)
            .cloned()
            .unwrap_or_else(|| TagValue::Text(String::new()));
        result.insert(*key, value);
    }
    result
}

pub fn id3v22_tags_to_raw(tags: &HashMap<FrameKey, TagValue>) -> HashMap<&'static str, TagValue> {
    tags.iter()
        .map(|(k, v)| (id3v22_code(*k), v.clone()))
        .collect()
}

pub fn id3v24_raw_to_tags(raw: &HashMap<String, TagValue>) -> HashMap<FrameKey, TagValue> {
    let mut result = HashMap::new();
    for key in ID3V24_REVERSE_MAP.values() {
        let id = id3v24_code(*key);
        let value = raw
            .get(id)
            .or_else(|| {
                if *key == FrameKey::Year {
                    raw.get("TYER")
                } else {
                    None
                }
            })
            .cloned()
            .unwrap_or_else(|| TagValue::Text(String::new()));
        result.insert(*key, value);
    }
    result
}

pub fn id3v24_tags_to_raw(tags: &HashMap<FrameKey, TagValue>) -> HashMap<&'static str, TagValue> {
    tags.iter()
        .map(|(k, v)| (id3v24_code(*k), v.clone()))
        .collect()
}
