use crate::tag_manager::utils::FrameKey;
use crate::tag_manager::utils::TagValue;
use once_cell::sync::Lazy;
use std::collections::HashMap;

pub fn itunes_code(key: FrameKey) -> &'static str {
    match key {
        FrameKey::Title => "©nam",                    // Name/Title
        FrameKey::Artist => "©ART",                   // Artist
        FrameKey::Album => "©alb",                    // Album
        FrameKey::Year => "©day",                     // Year/Date
        FrameKey::TrackNumber => "trkn",              // Track number
        FrameKey::Genre => "©gen", // Genre (can also be "gnre" for standard genres)
        FrameKey::AlbumArtist => "aART", // Album artist
        FrameKey::ContentGroup => "©grp", // Grouping
        FrameKey::Composer => "©wrt", // Composer/Writer
        FrameKey::EncodedBy => "©too", // Encoded by (tool)
        FrameKey::UnsyncedLyrics => "©lyr", // Lyrics
        FrameKey::Length => "----", // Custom freeform field
        FrameKey::Conductor => "----", // Custom freeform field
        FrameKey::AttachedPicture => "covr", // Cover art
        FrameKey::UserDefinedURL => "----", // Custom freeform field
        FrameKey::Comments => "©cmt", // Comment
        FrameKey::Private => "----", // Custom freeform field
        FrameKey::RelativeVolumeAdjustment => "----", // Custom freeform
        FrameKey::EncryptionMethod => "----", // Custom freeform
        FrameKey::GroupIdRegistration => "----", // Custom freeform
        FrameKey::GeneralObject => "----", // Custom freeform
        FrameKey::CommercialURL => "----", // Custom freeform
        FrameKey::CopyrightURL => "cprt", // Copyright
        FrameKey::AudioFileURL => "----", // Custom freeform
        FrameKey::ArtistURL => "----", // Custom freeform
        FrameKey::RadioStationURL => "----", // Custom freeform
        FrameKey::PaymentURL => "----", // Custom freeform
        FrameKey::BitmapImageURL => "----", // Custom freeform
        FrameKey::UserDefinedText => "----", // Custom freeform
        FrameKey::SynchronizedLyrics => "----", // Custom freeform
        FrameKey::TempoCodes => "----", // Custom freeform
        FrameKey::MusicCDIdentifier => "----", // Custom freeform
        FrameKey::EventTimingCodes => "----", // Custom freeform
        FrameKey::Sequence => "----", // Custom freeform
        FrameKey::PlayCount => "pcnt", // Play count (non-user-editable)
        FrameKey::AudioSeekPointIndex => "----", // Custom freeform
        FrameKey::MediaType => "stik", // Media type
        FrameKey::CommercialFrame => "----", // Custom freeform
        FrameKey::AudioEncryption => "----", // Custom freeform
        FrameKey::SignatureFrame => "----", // Custom freeform
        FrameKey::SoftwareEncoder => "©too", // Same as EncodedBy
        FrameKey::AudioEncodingMethod => "----", // Custom freeform
        FrameKey::RecommendedBufferSize => "----", // Custom freeform
        FrameKey::BeatsPerMinute => "tmpo", // BPM/Tempo
        FrameKey::Language => "----", // Custom freeform
        FrameKey::FileType => "----", // Custom freeform
        FrameKey::Time => "----",  // Custom freeform
        FrameKey::RecordingDate => "----", // Same as Year
        FrameKey::ReleaseDate => "----", // Same as Year
    }
}
#[derive(Debug, Clone)]
pub struct AtomFlag {
    pub name: &'static str,
    pub flag: [u8; 4],
    pub size: Option<u32>,
    pub boolean: bool,
    pub no_size_limit: bool,
}

pub static ATOMS_WITH_FLAGS: &[AtomFlag] = &[
    AtomFlag {
        name: "©alb",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©ART",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "aART",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©cmt",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©day",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©nam",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©gen",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "gnre",
        flag: [0x00, 0x00, 0x00, 0x00],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "trkn",
        flag: [0x00, 0x00, 0x00, 0x00],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "disk",
        flag: [0x00, 0x00, 0x00, 0x00],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©wrt",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©too",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "tmpo",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "cprt",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "cpil",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: true,
        no_size_limit: false,
    },
    AtomFlag {
        name: "covr",
        flag: [0x00, 0x00, 0x00, 0x0e],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "rtng",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "©grp",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "stik",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "pcst",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: true,
        no_size_limit: false,
    },
    AtomFlag {
        name: "catg",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "keyw",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "purl",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "egid",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "desc",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: true,
    },
    AtomFlag {
        name: "©lyr",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: true,
    },
    AtomFlag {
        name: "tvnn",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "tvsh",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "tven",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "tvsn",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: Some(32),
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "tves",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: Some(32),
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "purd",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "apID",
        flag: [0x00, 0x00, 0x00, 0x01],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "pgap",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: true,
        no_size_limit: false,
    },
    AtomFlag {
        name: "akID",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: None,
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "cnID",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: Some(32),
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "atID",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: Some(32),
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "sfID",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: Some(32),
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "geID",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: Some(32),
        boolean: false,
        no_size_limit: false,
    },
    AtomFlag {
        name: "plID",
        flag: [0x00, 0x00, 0x00, 0x15],
        size: Some(64),
        boolean: false,
        no_size_limit: false,
    },
];

pub fn get_atom_flag(name: &str) -> Option<&'static AtomFlag> {
    ATOMS_WITH_FLAGS.iter().find(|atom| atom.name == name)
}

pub static ITUNES_REVERSE_MAP: Lazy<HashMap<&'static str, FrameKey>> = Lazy::new(|| {
    let mut map = HashMap::new();

    let mappings = [
        ("©nam", FrameKey::Title),
        ("©ART", FrameKey::Artist),
        ("©alb", FrameKey::Album),
        ("©day", FrameKey::Year),
        ("trkn", FrameKey::TrackNumber),
        ("©gen", FrameKey::Genre),
        // ("gnre", FrameKey::Genre), // Alternative genre code (numeric)
        ("aART", FrameKey::AlbumArtist),
        ("©grp", FrameKey::ContentGroup),
        ("©wrt", FrameKey::Composer),
        ("©too", FrameKey::EncodedBy),
        ("©lyr", FrameKey::UnsyncedLyrics),
        ("covr", FrameKey::AttachedPicture),
        ("©cmt", FrameKey::Comments),
        ("cprt", FrameKey::CopyrightURL),
        ("pcnt", FrameKey::PlayCount),
        ("stik", FrameKey::MediaType),
        ("tmpo", FrameKey::BeatsPerMinute),
        // ("disk", FrameKey::TrackNumber), // Disk number (similar to track)
        ("©enc", FrameKey::EncodedBy), // Encoded by (alternative)
        // ("soal", FrameKey::Album),     // Sort album
        // ("soaa", FrameKey::AlbumArtist), // Sort album artist
        // ("soar", FrameKey::Artist),      // Sort artist
        // ("sonm", FrameKey::Title),       // Sort name
        ("soco", FrameKey::Composer),       // Sort composer
        ("rtng", FrameKey::MediaType),      // Rating/Content rating
        ("cpil", FrameKey::MediaType),      // Compilation flag
        ("pgap", FrameKey::MediaType),      // Gapless playback
        ("©des", FrameKey::Comments),       // Description
        ("desc", FrameKey::Comments),       // Description (alternative)
        ("ldes", FrameKey::Comments),       // Long description
        ("©pub", FrameKey::EncodedBy),      // Publisher
        ("purd", FrameKey::Year),           // Purchase date
        ("catg", FrameKey::Genre),          // Category (podcast)
        ("keyw", FrameKey::ContentGroup),   // Keywords
        ("purl", FrameKey::UserDefinedURL), // Podcast URL
        ("egid", FrameKey::UserDefinedURL), // Episode global unique ID
                                            // ("©mvn", FrameKey::Title),       // Movement name
                                            // ("©mvi", FrameKey::TrackNumber), // Movement number
                                            // ("©mvc", FrameKey::TrackNumber), // Movement count
                                            // ("shwm", FrameKey::Title),       // Show name (TV)
                                            // ("tven", FrameKey::Title),       // TV episode name
                                            // ("tves", FrameKey::TrackNumber), // TV episode number
                                            // ("tvsn", FrameKey::TrackNumber), // TV season
                                            // ("tvnn", FrameKey::Title),       // TV network name
    ];

    for (code, key) in mappings {
        map.insert(code, key);
    }

    map
});

pub fn raw_to_tags(raw: &HashMap<String, TagValue>) -> HashMap<FrameKey, TagValue> {
    let mut result = HashMap::new();

    for (atom_code, frame_key) in ITUNES_REVERSE_MAP.iter() {
        let value = raw
            .get(*atom_code)
            .cloned()
            .unwrap_or_else(|| TagValue::Text(String::new()));
        result.insert(*frame_key, value);
    }

    result
}

pub fn tags_to_raw(tags: &HashMap<FrameKey, TagValue>) -> HashMap<&'static str, TagValue> {
    tags.iter()
        .map(|(key, value)| {
            let code = itunes_code(*key);
            (code, value.clone())
        })
        .collect()
}
