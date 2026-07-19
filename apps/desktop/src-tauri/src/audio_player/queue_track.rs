use std::fmt;
use std::fmt::{Display, Formatter};

use rubato::{Async, Indexing};
use symphonia::core::codecs::audio::AudioDecoder;
use symphonia::core::formats::FormatReader;

pub struct QueueTrack {
    pub format: Option<Box<dyn FormatReader>>,
    pub decoder: Option<Box<dyn AudioDecoder>>,
    pub track_id: u32,
    pub source_sample_rate: u32,
    pub channels_uz: usize,
    pub target_sample_rate: u32,
    pub is_preloaded: bool,
    pub resampler: Option<Async<f32>>,
    pub indata: Vec<f32>,
    pub outdata: Vec<f32>,
    pub indexing: Indexing,
    pub path: String,
    pub decode_buffer: Vec<f32>,
    pub packet_samples: Vec<f32>,
}
impl fmt::Debug for QueueTrack {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("QueeTrack")
            .field("username", &self.path)
            .field("secret_token", &"<REDACTED>") // Masking the value
            .finish()
    }
}
impl QueueTrack {
    pub fn new(path: String) -> Self {
        Self {
            format: None,
            decoder: None,
            is_preloaded: false,
            track_id: 0,
            source_sample_rate: 44100,
            channels_uz: 2usize,
            target_sample_rate: 44100u32,
            path: path,
            resampler: None,
            indata: Vec::new(),
            outdata: Vec::new(),
            indexing: Indexing::new(),

            decode_buffer: Vec::new(),
            packet_samples: Vec::new(),
        }
    }
    pub fn get_indexing(&self) -> &Indexing {
        return &self.indexing;
    }
}
