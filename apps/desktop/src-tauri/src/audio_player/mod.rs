// shi sounds funky on device change for bout 5 secs
mod queue;
mod queue_track;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Stream;
use queue::Queue;
use ringbuf::storage::Heap;
use ringbuf::wrap::caching::Caching;
use ringbuf::SharedRb;
use ringbuf::{
    traits::{Consumer, Producer, Split},
    HeapRb,
};
use std::fmt::{self, Display};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::Duration;

use symphonia::core::errors::Error;
use symphonia::core::formats::probe::Hint;
use symphonia::core::formats::TrackType;
use symphonia::core::io::MediaSourceStream;

use audioadapter_buffers::direct::InterleavedSlice;
use rubato::{Async, FixedAsync, Indexing, PolynomialDegree, Resampler};

use crate::audio_player::queue_track::QueueTrack;

pub enum PlayerCmd {
    Play,
    Preload,
    UpdateDeviceConfig { target_sample_rate: u32 },
}

pub struct AudioPlayer {
    pub queue: Arc<Mutex<queue::Queue>>,
    stream: Option<Stream>,
    cmd_tx: crossbeam_channel::Sender<PlayerCmd>,
    consumer: Arc<Mutex<Caching<Arc<SharedRb<Heap<f32>>>, false, true>>>,
}

impl Display for AudioPlayer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "stream player")
    }
}

impl AudioPlayer {
    pub fn new() -> Arc<Mutex<Self>> {
        let (cmd_tx, cmd_rx) = crossbeam_channel::unbounded::<PlayerCmd>();

        let cmd_rx2 = cmd_rx.clone();
        let cmd_tx2 = cmd_tx.clone();
        let rb = HeapRb::<f32>::new(192000 * 2 * 2);
        let (mut producer, consumer) = rb.split();
        let queue = Arc::new(Mutex::new(Queue::new(cmd_tx.clone())));
        let consumer = Arc::new(Mutex::new(consumer));

        let queue_1 = Arc::clone(&queue);
        // queue for preloaded track
        let queue_2 = Arc::clone(&queue);
        // strictly for preloading

        std::thread::spawn(move || {
            let mut format = None;
            let mut decoder = None;
            let mut track_id = 0;
            let mut source_sample_rate = 44100;
            let mut channels_uz = 2usize;
            let mut target_sample_rate = 44100u32;
            let mut is_done = false;
            let mut resampler = None;
            let mut indata = Vec::new();
            let mut outdata = Vec::new();
            let indexing = Indexing::new();

            let mut decode_buffer: Vec<f32> = Vec::new();
            let mut packet_samples: Vec<f32> = Vec::new();

            loop {
                if is_done {
                    let q = queue_1.lock().unwrap();
                    let current_t = q.tracks.get(q.index as usize);
                    if current_t.is_none() {
                        continue;
                    }
                    let current_t_arc = Arc::clone(current_t.unwrap());
                    let mut current_track = current_t_arc.lock().unwrap();
                    if current_track.is_preloaded == true {
                        track_id = current_track.track_id;

                        source_sample_rate = current_track.source_sample_rate;

                        channels_uz = current_track.channels_uz;

                        decoder = current_track.decoder.take();

                        format = current_track.format.take();
                        current_track.is_preloaded = false;
                        decode_buffer.clear();
                        packet_samples.clear();
                        println!("Preloaded!!!");
                    } else {
                        println!("Preloaded\n\n\n not:(\n");
                        let _ = cmd_tx2.send(PlayerCmd::Play);
                    }

                    is_done = false;
                }
                while let Ok(cmd) = cmd_rx.recv_timeout(Duration::from_millis(10)) {
                    match cmd {
                        PlayerCmd::Play => {
                            let mut q = queue_1.lock().unwrap();
                            let current_t = q.tracks.get(q.index as usize);
                            if current_t.is_none() {
                                continue;
                            }
                            let current_t_arc = Arc::clone(current_t.unwrap());
                            let current_track = current_t_arc;
                            drop(q);

                            decode_buffer.clear();
                            packet_samples.clear();

                            let file_path = &current_track.lock().unwrap().path;
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

                            let track = probed.default_track(TrackType::Audio).expect("no track");

                            track_id = track.id;

                            let codec_params = track.codec_params.as_ref().expect("no params");
                            let audio_codec_params = codec_params.audio().expect("no audio params");

                            source_sample_rate = audio_codec_params.sample_rate.expect("no rate");
                            channels_uz = audio_codec_params
                                .channels
                                .as_ref()
                                .expect("no channel info")
                                .count();

                            decoder = Some(
                                symphonia::default::get_codecs()
                                    .make_audio_decoder(audio_codec_params, &Default::default())
                                    .expect("unsupported codec"),
                            );

                            format = Some(probed);
                            resampler = None;
                        }
                        PlayerCmd::UpdateDeviceConfig {
                            target_sample_rate: new_rate,
                        } => {
                            target_sample_rate = new_rate;
                            resampler = None;
                        }
                        PlayerCmd::Preload => {}
                        _ => {}
                    }
                }

                if format.is_none() || decoder.is_none() {
                    std::thread::sleep(Duration::from_millis(10));
                    continue;
                }

                if resampler.is_none() {
                    let resample_ratio = target_sample_rate as f64 / source_sample_rate as f64;
                    let chunk_size = 1024usize;
                    let r = Async::<f32>::new_poly(
                        resample_ratio,
                        1.1,
                        PolynomialDegree::Cubic,
                        chunk_size,
                        channels_uz,
                        FixedAsync::Input,
                    )
                    .unwrap();

                    indata = vec![0.0f32; channels_uz * chunk_size];
                    outdata = vec![0.0f32; channels_uz * r.output_frames_max()];
                    resampler = Some(r);
                }

                let current_resampler = resampler.as_mut().unwrap();
                let required_samples = current_resampler.input_frames_next() * channels_uz;

                if decode_buffer.len() < required_samples {
                    let fmt_ref = format.as_mut().unwrap();
                    let dec_ref = decoder.as_mut().unwrap();

                    match fmt_ref.next_packet() {
                        Ok(packet) => {
                            if packet.is_none() {
                                if is_done == true {
                                    continue;
                                }
                                let mut q = queue_1.lock().unwrap();
                                let new_t = q.tracks.get(q.index as usize + 1usize);
                                if new_t.is_some() {
                                    is_done = true;
                                    q.next();
                                }
                                continue;
                            }
                            let packet = packet.unwrap();
                            if packet.track_id == track_id {
                                if let Ok(audio_buf) = dec_ref.decode(&packet) {
                                    let needed = audio_buf.samples_interleaved();
                                    packet_samples.resize(needed, 0.0);

                                    audio_buf.copy_to_slice_interleaved(&mut packet_samples);
                                    decode_buffer.extend_from_slice(&packet_samples);
                                }
                            }
                        }

                        Err(Error::ResetRequired) => {
                            println!("hmm");
                            // create decoder prolly
                        }
                        Err(_) => {
                            // probably eof
                            println!("eof");

                            std::thread::sleep(Duration::from_millis(10));
                            continue;
                        }
                    }
                }

                if decode_buffer.len() >= required_samples {
                    let chunk_samples: Vec<f32> =
                        decode_buffer.drain(0..required_samples).collect();
                    indata.copy_from_slice(&chunk_samples);

                    let frames_to_read = current_resampler.input_frames_next();
                    let input_adapter =
                        InterleavedSlice::new(&indata, channels_uz, frames_to_read).unwrap();

                    let current_capacity = outdata.len() / channels_uz;
                    let mut output_adapter =
                        InterleavedSlice::new_mut(&mut outdata, channels_uz, current_capacity)
                            .unwrap();

                    let (_, frames_written) = current_resampler
                        .process_into_buffer(&input_adapter, &mut output_adapter, Some(&indexing))
                        .unwrap();

                    let total_written = frames_written * channels_uz;
                    let resampled_slice = &outdata[0..total_written];

                    let mut written = 0usize;
                    while written < resampled_slice.len() {
                        let pushed = producer.push_slice(&resampled_slice[written..]);
                        written += pushed;
                        if written < resampled_slice.len() {
                            std::thread::sleep(Duration::from_millis(2));
                        }
                    }
                }
            }
        });

        let player = Arc::new(Mutex::new(Self {
            stream: None,
            queue: queue,
            cmd_tx,
            consumer: Arc::clone(&consumer),
        }));

        {
            let mut locked = player.lock().unwrap();
            locked.rebuild_active_stream(Arc::clone(&player));
        }

        player
    }

    pub fn rebuild_active_stream(&mut self, player_arc_clone: Arc<Mutex<Self>>) {
        self.stream = None;

        let host = cpal::default_host();
        let device = match host.default_output_device() {
            Some(d) => d,
            None => return,
        };

        let device_config = device.default_output_config().unwrap();
        let target_sample_rate = device_config.sample_rate();
        let channels = device_config.channels();

        let config = cpal::StreamConfig {
            channels,
            sample_rate: target_sample_rate,
            buffer_size: cpal::BufferSize::Default,
        };

        let _ = self.cmd_tx.send(PlayerCmd::UpdateDeviceConfig {
            target_sample_rate: target_sample_rate,
        });

        let consumer = Arc::clone(&self.consumer);

        let stream = device
            .build_output_stream(
                config.to_owned(),
                move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                    if let Ok(mut c) = consumer.lock() {
                        let read = c.pop_slice(data);
                        if read < data.len() {
                            data[read..].fill(0.0);
                        }
                    } else {
                        data.fill(0.0);
                    }
                },
                move |_err| {
                    let player_inner = Arc::clone(&player_arc_clone);
                    std::thread::spawn(move || {
                        std::thread::sleep(Duration::from_millis(150));
                        if let Ok(mut locked) = player_inner.lock() {
                            locked.rebuild_active_stream(player_inner.clone());
                        }
                    });
                },
                None,
            )
            .unwrap();

        stream.play().unwrap();
        self.stream = Some(stream);
    }
}
