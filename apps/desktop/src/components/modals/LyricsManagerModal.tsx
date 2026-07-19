import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/ui/components/Button";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import TextareaAutosize from "react-textarea-autosize";
import Img from "../../assets/images/unknown.jpg";
import { Line, LyricLine, MetadataLine, LineType } from "clrc";
import { File } from "@/ui/types";
import { AnimatePresence } from "motion/react";
import { Modal } from "./Modal";
import { useChanges } from "@/ui/hooks/useChanges";
import { Select, SelectOption } from "@/ui/components/Select";
import { cn, getFirstValue } from "@/ui/lib/utils";
import { MinusIcon, PauseIcon, PlayIcon, PlusIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
export interface LyricsManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LyricsManagerModal({
  open,
  onClose,
}: LyricsManagerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [files, setFiles] = useState<SelectOption[]>([]);
  const { selected, allFiles } = useChanges();
  const [isPreview, setIsPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lyrics, setLyrics] = useState<
    Array<MetadataLine<string> | Line | LyricLine>
  >([]);

  const audioElement = useRef<HTMLAudioElement>(null);
  const trackFillRef = useRef<HTMLDivElement>(null);

  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const remainingTimeRef = useRef<HTMLSpanElement>(null);
  const [editingAt, setEditingAt] = useState<number>(0);
  const { changes } = useChanges();
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    if (!audioElement.current) return;
    const audioPlayer = audioElement.current;
    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;

    if (trackFillRef.current)
      trackFillRef.current.style.width = `${percentage}%`;

    if (currentTimeRef.current)
      currentTimeRef.current.innerText = formatTime(audioPlayer.currentTime);
    if (remainingTimeRef.current)
      remainingTimeRef.current.innerText = `-${formatTime(audioPlayer.duration - audioPlayer.currentTime)}`;
    const handleTimeUpdate = () => {
      const currentAudioPlayer = audioElement.current;
      if (!currentAudioPlayer) return;
      setCurrentTime(currentAudioPlayer.currentTime * 1000);

      const percentage =
        (currentAudioPlayer.currentTime / currentAudioPlayer.duration) * 100;

      if (trackFillRef.current)
        trackFillRef.current.style.width = `${percentage}%`;

      if (currentTimeRef.current)
        currentTimeRef.current.innerText = formatTime(
          currentAudioPlayer.currentTime,
        );
      if (remainingTimeRef.current)
        remainingTimeRef.current.innerText = `-${formatTime(currentAudioPlayer.duration - currentAudioPlayer.currentTime)}`;
    };

    audioPlayer.addEventListener("timeupdate", handleTimeUpdate);
    audioPlayer.addEventListener("play", handlePlay);
    audioPlayer.addEventListener("pause", handlePause);

    return () => {
      audioPlayer.removeEventListener("timeupdate", handleTimeUpdate);
      audioPlayer.removeEventListener("play", handlePlay);
      audioPlayer.removeEventListener("pause", handlePause);
    };
  }, [audioSrc]);
  useEffect(() => {
    if (!open) return;
    if (!file) {
      setAudioSrc(null);
      return;
    }

    setAudioSrc(convertFileSrc(file.path));
  }, [file, open]);
  useEffect(() => {}, [changes.lyrics]);
  useEffect(() => {
    setFiles([]);
    if (open === false) return;

    selected.forEach((selectedFilePath) => {
      const selectedFile = allFiles.get(selectedFilePath);
      if (!selectedFile) return;
      setFiles((v) => [
        ...v,
        { label: selectedFile.fileName, value: selectedFile.path },
      ]);
    });
    if (selected.size === 1) {
      const f = allFiles.get(selected.values().next().value ?? "");
      if (f) {
        setFile(f);
      }
    }
  }, [selected, open]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioElement.current;
    if (!audio || !audio.duration) return;

    const percentage = Number(e.target.value);
    const newTime = (percentage / 100) * audio.duration;

    audio.currentTime = newTime;

    if (trackFillRef.current)
      trackFillRef.current.style.width = `${percentage}%`;

    if (currentTimeRef.current)
      currentTimeRef.current.innerText = formatTime(newTime);
    if (remainingTimeRef.current)
      remainingTimeRef.current.innerText = `-${formatTime(audio.duration - newTime)}`;
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      sizeMax={true}
      title="Edit Lyrics"
      bodyClassName=" flex flex-col"
      footer={
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className=" pb-12 flex px-4 py-4 ">
        <span>Editing Lyrics for:</span>
        <Select
          className="ml-auto"
          onChange={(val) => {
            const selectedFile = allFiles.get(val);
            if (!selectedFile) return;
            setFile(selectedFile);
          }}
          value={file ? file.path : undefined}
          options={files}
        ></Select>
      </div>
      <div className="px-4 flex">
        <Button
          className="ml-auto"
          onClick={() => setIsPreview((oldval) => !oldval)}
        >
          {isPreview ? "Edit mode" : "Preview"}
        </Button>
      </div>
      <div className="editor h-[80%] flex w-full flex-col px-4 ">
        <div className="lyrics gap-2 flex flex-col overflow-scroll">
          {lyrics.map((l, i) => {
            if (!audioElement.current) {
              return <></>;
            }
            let isInvalid = l.type === LineType.INVALID;
            let endTime: number = 0;
            if (i > 0 && l.type === LineType.LYRIC) {
              const realLine = l as LyricLine;
              const previousLines = lyrics.slice(0, i);
              const closestPrev = previousLines.findLast(
                (item) =>
                  item.type !== LineType.METADATA &&
                  item.type !== LineType.INVALID,
              );

              if (closestPrev) {
                const previousLine = closestPrev as LyricLine;
                if (previousLine.startMillisecond >= realLine.startMillisecond)
                  isInvalid = true;
              }
            }

            if (i < lyrics.length && l.type === LineType.LYRIC) {
              const realLine = l as LyricLine;
              const previousLines = lyrics.slice(i + 1);
              const closestNext = previousLines.find(
                (item) =>
                  item.type !== LineType.METADATA &&
                  item.type !== LineType.INVALID,
              );

              if (closestNext) {
                const nextLine = closestNext as LyricLine;
                if (realLine.startMillisecond >= nextLine.startMillisecond) {
                  isInvalid = true;
                } else {
                  endTime = nextLine.startMillisecond;
                }
              } else {
                endTime = audioElement.current.duration * 1000;
              }
            }

            if (l.type === LineType.LYRIC) {
              const lyric = l as LyricLine;

              const previousLine = lyrics
                .slice(0, i)
                .findLast((item) => item.type === LineType.LYRIC) as
                | LyricLine
                | undefined;

              if (
                previousLine &&
                previousLine.startMillisecond >= lyric.startMillisecond
              ) {
                isInvalid = true;
              }

              const nextLine = lyrics
                .slice(i + 1)
                .find((item) => item.type === LineType.LYRIC) as
                | LyricLine
                | undefined;

              if (nextLine) {
                if (lyric.startMillisecond >= nextLine.startMillisecond) {
                  isInvalid = true;
                } else {
                  endTime = nextLine.startMillisecond;
                }
              } else {
                endTime = audioElement.current.duration
                  ? audioElement.current.duration * 1000
                  : 0;
              }

              const isActive =
                currentTime >= lyric.startMillisecond &&
                currentTime < endTime &&
                endTime !== 0 &&
                isInvalid === false;

              return (
                <div
                  key={`lyric-${i}`}
                  onClick={() => {
                    if (isPreview === true) {
                      if (audioElement.current) {
                        audioElement.current.currentTime =
                          lyric.startMillisecond / 1000;
                        audioElement.current.play();
                      }
                      return;
                    }
                    if (editingAt !== i) {
                      setEditingAt(i);
                    }
                  }}
                  className="lyric items-center flex gap-x-2 cursor-default"
                >
                  {!isPreview && (
                    <div
                      onClick={() => {}}
                      className="flex w-40  bg-muted gap-2 px-2 py-1 rounded items-center"
                    >
                      <button
                        onClick={() => {
                          setLyrics((oldLyrics) => {
                            return oldLyrics
                              .toSpliced(i, 1)
                              .toSorted((a, b) => {
                                const first = a as LyricLine;
                                const second = b as LyricLine;
                                if (
                                  first.startMillisecond === undefined &&
                                  second.startMillisecond === undefined
                                )
                                  return 0;

                                if (first.startMillisecond === undefined)
                                  return 1;

                                if (second.startMillisecond === undefined)
                                  return -1;

                                return (
                                  first.startMillisecond -
                                  second.startMillisecond
                                );
                              })
                              .map((obj, idx) => ({ ...obj, lineNumber: idx }));
                          });
                        }}
                        className="hover:bg-hover py-1 px-1 rounded "
                      >
                        <XIcon size={17} />
                      </button>

                      <span className="ml-auto text-xs">
                        {formatMs(lyric.startMillisecond)}
                      </span>
                      <div className="flex gap-1 ml-auto ">
                        <button
                          onClick={() => {
                            if (lyric.startMillisecond - 250 < 0) {
                              return;
                            }
                            setLyrics((oldLyrics) => {
                              return oldLyrics
                                .map((lyr, oldIndex) =>
                                  i === oldIndex
                                    ? {
                                        ...lyr,
                                        startMillisecond:
                                          lyric.startMillisecond - 250,
                                      }
                                    : lyr,
                                )
                                .toSorted((a, b) => {
                                  const first = a as LyricLine;
                                  const second = b as LyricLine;
                                  if (
                                    first.startMillisecond === undefined &&
                                    second.startMillisecond === undefined
                                  )
                                    return 0;

                                  if (first.startMillisecond === undefined)
                                    return 1;

                                  if (second.startMillisecond === undefined)
                                    return -1;

                                  return (
                                    first.startMillisecond -
                                    second.startMillisecond
                                  );
                                })
                                .map((obj, idx) => ({
                                  ...obj,
                                  lineNumber: idx,
                                }));
                            });
                          }}
                          className="hover:bg-hover py-1 px-1 rounded "
                        >
                          <MinusIcon size={17} />
                        </button>

                        <button
                          onClick={() => {
                            if (!audioElement.current) return;
                            if (
                              lyric.startMillisecond + 250 >
                              audioElement.current.duration * 1000
                            ) {
                              return;
                            }
                            setLyrics((oldLyrics) => {
                              return oldLyrics
                                .map((lyr, oldIndex) =>
                                  i === oldIndex
                                    ? {
                                        ...lyr,
                                        startMillisecond:
                                          lyric.startMillisecond + 250,
                                      }
                                    : lyr,
                                )
                                .toSorted((a, b) => {
                                  const first = a as LyricLine;
                                  const second = b as LyricLine;
                                  if (
                                    first.startMillisecond === undefined &&
                                    second.startMillisecond === undefined
                                  )
                                    return 0;

                                  if (first.startMillisecond === undefined)
                                    return 1;

                                  if (second.startMillisecond === undefined)
                                    return -1;

                                  return (
                                    first.startMillisecond -
                                    second.startMillisecond
                                  );
                                })
                                .map((obj, idx) => ({
                                  ...obj,
                                  lineNumber: idx,
                                }));
                            });
                          }}
                          className="hover:bg-hover py-1 px-1 rounded "
                        >
                          <PlusIcon size={17} />
                        </button>
                      </div>
                    </div>
                  )}

                  {editingAt === i ? (
                    <TextareaAutosize
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                      onBlur={() => setEditingAt(-1)}
                      placeholder="Text goes here....."
                      className="bg-transparent w-full resize-none text-2xl outline-none"
                      onChange={(e) => {
                        setLyrics((oldLyrics) =>
                          oldLyrics.map((lyric, oldIndex) =>
                            i === oldIndex
                              ? { ...lyric, content: e.target.value }
                              : lyric,
                          ),
                        );
                      }}
                      value={lyric.content}
                    />
                  ) : (
                    <span
                      className={cn(
                        isActive === true
                          ? "text-3xl text-foreground"
                          : "text-muted-foreground/30 text-2xl",
                        "transition-all duration-250 [line-break:anywhere] ",
                      )}
                    >
                      {lyric.content}
                    </span>
                  )}
                </div>
              );
            }
          })}
        </div>

        {!isPreview && (
          <button
            onClick={() => {
              setEditingAt(lyrics.length);
              let defaultStartTime = 0;
              if (audioElement.current) {
                defaultStartTime = audioElement.current.currentTime * 1000;
              }
              console.log({ defaultStartTime });

              setLyrics((oldLyrics) => {
                return [
                  ...oldLyrics,
                  {
                    lineNumber: oldLyrics.length,
                    content: "",
                    raw: "",
                    startMillisecond: defaultStartTime,
                    type: LineType.LYRIC,
                  },
                ]
                  .toSorted((a, b) => {
                    const first = a as LyricLine;
                    const second = b as LyricLine;
                    if (
                      first.startMillisecond === undefined &&
                      second.startMillisecond === undefined
                    )
                      return 0;

                    if (first.startMillisecond === undefined) return 1;

                    if (second.startMillisecond === undefined) return -1;

                    return first.startMillisecond - second.startMillisecond;
                  })
                  .map((obj, idx) => ({ ...obj, lineNumber: idx }));
              });
            }}
            className="text-xl mt-4 rounded py-1 pointer px-2 w-max bg-muted text-muted-foreground overflow-y-scroll"
          >
            Add Line
          </button>
        )}
      </div>
      {file && (
        <div className=" border-t w-full border-border flex h-24 px-3 gap-12">
          <div className="flex mt-4 gap-4 w-1/3">
            <img
              className="size-12 rounded"
              src={(() => {
                if (file) {
                  const image = getFirstValue(
                    file.frames.attachedPicture,
                    "Picture",
                  );
                  if (image) {
                    return `data:${image.value.mime};base64,${image.value.data_base64}`;
                  }
                }

                return Img;
              })()}
            ></img>

            <div className="flex flex-col truncate">
              <span className="text-sm">
                {getFirstValue(file.frames.title, "Text")?.value ?? "No Title"}
              </span>
              <span className="text-xs text-primary">
                {getFirstValue(file.frames.artist, "Text")?.value ?? "No Title"}
              </span>
            </div>
          </div>
          <div className="w-full ">
            <div className="group relative flex flex-col justify-center h-8 cursor-pointer ">
              <div className="absolute left-0 right-0 h-1 bg-muted  rounded-full transition-all duration-200 ease-out group-hover:h-1.5">
                <div
                  ref={trackFillRef}
                  className="h-full bg-accent rounded-full w-0"
                />
              </div>

              <input
                type="range"
                min="0"
                max="100"
                defaultValue="0"
                onChange={handleInputChange}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="flex  text-[11px] font-medium mt-1 font-mono">
              <span ref={currentTimeRef}>0:00</span>
              <AnimatePresence mode="wait">
                <div className="ml-auto flex gap-2">
                  {isPlaying ? (
                    <motion.div
                      key="pause-btn"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      onClick={() => audioElement.current?.pause()}
                    >
                      <PauseIcon fill="currentColor" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play-btn"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      onClick={() =>
                        invoke("request_playback", { paths: [file.path] })
                      }
                    >
                      <PlayIcon fill="currentColor" />
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
              <span className="ml-auto" ref={remainingTimeRef}>
                -0:00
              </span>
            </div>
          </div>
        </div>
      )}

      <audio
        className="hidden"
        controls
        ref={audioElement}
        src={audioSrc as string | undefined}
      />
    </Modal>
  );
}

function formatMs(ms: number): string {
  const totalMs = Math.floor(ms);

  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")}`;
}
function formatTime(secs: number): string {
  if (isNaN(secs)) return "0:00";
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
