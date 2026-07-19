use std::ops::Deref;
use std::sync::{Arc, Mutex};

use symphonia::core::formats::probe::Hint;
use symphonia::core::io::MediaSourceStream;

use crate::audio_player::{queue_track::QueueTrack, PlayerCmd};

pub struct Queue {
    pub tracks: Vec<Arc<Mutex<QueueTrack>>>,
    pub index: i32,
    cmd_tx: crossbeam_channel::Sender<PlayerCmd>,
}

impl Queue {
    pub fn new(cmd_tx: crossbeam_channel::Sender<PlayerCmd>) -> Self {
        Queue {
            tracks: Vec::new(),
            cmd_tx,
            index: 0,
        }
    }

    pub fn add(&mut self, item: String) {
        let new_track = QueueTrack::new(item);
        self.tracks.push(Arc::new(Mutex::new(new_track)));
        if self.tracks.len() == 1 {
            let _ = self.cmd_tx.send(PlayerCmd::Play);
        }
        self.preload();
    }
    pub fn next(&mut self) {
        self.index = self.index + 1;
    }
    pub fn preload(&mut self) {
        let track_to_preload = self.tracks.get(self.index as usize + 1);

        if track_to_preload.is_none() {
            return;
        }

        let mut track_to_preload = track_to_preload.unwrap().lock().unwrap();
        println!("preload for: {:?}, {:?}", track_to_preload, self.index);
        let file_path = &track_to_preload.path;

        let src = std::fs::File::open(&file_path).expect("failed to open file");

        let mss = MediaSourceStream::new(Box::new(src), Default::default());
        let mut hint = Hint::new();
        if let Some(ext) = std::path::Path::new(&file_path)
            .extension()
            .and_then(|e| e.to_str())
        {
            hint.with_extension(ext);
        }

        let probed = symphonia::default::get_probe()
            .probe(&hint, mss, Default::default(), Default::default())
            .expect("unsupported format");

        let track = probed
            .default_track(symphonia::core::formats::TrackType::Audio)
            .expect("no track");

        track_to_preload.track_id = track.id;

        let codec_params = track.codec_params.as_ref().expect("no params");
        let audio_codec_params = codec_params.audio().expect("no audio params");

        track_to_preload.source_sample_rate = audio_codec_params.sample_rate.expect("no rate");
        track_to_preload.channels_uz = audio_codec_params
            .channels
            .as_ref()
            .expect("no channel info")
            .count();

        track_to_preload.decoder = Some(
            symphonia::default::get_codecs()
                .make_audio_decoder(audio_codec_params, &Default::default())
                .expect("unsupported codec"),
        );

        track_to_preload.format = Some(probed);
        track_to_preload.resampler = None;
        track_to_preload.is_preloaded = true;
        println!("finished preloading")
    }
}
