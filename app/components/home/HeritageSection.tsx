"use client";

import React, { useEffect, useRef, useState } from "react";
import { Leaf, Play, Volume2, VolumeX, Wheat } from "lucide-react";

const HERITAGE_POINTS = [
  "Cold pressed with care",
  "Natural pantry essentials",
  "Traditional kitchen values",
];

const HERITAGE_STATS = [
  { stat: "16:9", label: "Wider visual story" },
  { stat: "Pure", label: "Ingredient-led quality" },
  { stat: "Daily", label: "Made for real homes" },
];

export default function HeritageSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const wrapper = videoWrapperRef.current;
    if (!wrapper || shouldLoadVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoadVideo(true);
        observer.disconnect();
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [shouldLoadVideo]);

  useEffect(() => {
    if (!shouldLoadVideo) return;

    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.load();
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setIsMuted(true);
        video.muted = true;
      });
    }
  }, [shouldLoadVideo]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextState = !isMuted;
    videoRef.current.muted = nextState;
    setIsMuted(nextState);
  };

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fffaf1_0%,#f3ead8_100%)] py-10 lg:py-20">
      <div className="pointer-events-none absolute left-[-7rem] top-10 h-72 w-72 rounded-full bg-[#d79d44]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-5rem] h-80 w-80 rounded-full bg-[#2b5a23]/8 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-8 grid gap-8 lg:mb-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dfd1b9] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8c5f22] shadow-[0_10px_24px_rgba(92,72,31,0.06)]">
                <Wheat className="h-3.5 w-3.5 text-[#2b5a23]" strokeWidth={2.3} />
                Gram Ansh heritage
              </div>

              <h2 className="max-w-3xl text-3xl font-black tracking-[-0.05em] text-[#24461e] md:text-5xl">
                A more honest kitchen story,{" "}
                <span className="text-[#8c5f22]">shown with clarity</span>
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f5a44] md:text-base">
                Gram Ansh is shaped by slower preparation, cleaner ingredients,
                and everyday trust. This section now gives the video room to
                breathe in a proper 16:9 frame while keeping the story grounded
                and readable.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {HERITAGE_POINTS.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-[#dfd1b9] bg-white px-3 py-1.5 text-[11px] font-bold text-[#2b5a23] shadow-[0_8px_18px_rgba(92,72,31,0.05)]"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {HERITAGE_STATS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[26px] border border-[#e6d7c1] bg-white/80 p-5 shadow-[0_12px_30px_rgba(92,72,31,0.06)] backdrop-blur-sm"
                >
                  <div className="text-2xl font-black tracking-[-0.04em] text-[#24461e]">
                    {item.stat}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-[#7b6a56]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto max-w-[1100px] max-h[400px]">
            <div className="absolute inset-0 scale-[1.02] rounded-[34px] bg-[linear-gradient(135deg,rgba(43,90,35,0.14)_0%,rgba(215,157,68,0.16)_100%)] blur-2xl" />

            <div
              ref={videoWrapperRef}
              className="relative overflow-hidden rounded-[34px] border border-[#ddcfb7] bg-[#f7efe1] p-3 shadow-[0_24px_70px_rgba(78,61,26,0.18)] sm:p-4"
            >
              <div className="relative aspect-video overflow-hidden rounded-[26px] bg-[#ede2ce]">
                {!shouldLoadVideo ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f5efdf_0%,#eadcc5_100%)]">
                    <div className="flex flex-col items-center gap-3 px-4 text-center text-[#24461e]">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-[0_10px_24px_rgba(92,72,31,0.12)]">
                        <Play
                          className="ml-0.5 h-6 w-6 text-[#8c5f22]"
                          fill="currentColor"
                        />
                      </div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8c5f22]">
                        Loading Gram Ansh film
                      </div>
                    </div>
                  </div>
                ) : null}

                <video
                  ref={videoRef}
                  autoPlay={shouldLoadVideo}
                  muted
                  loop
                  preload="none"
                  playsInline
                  poster="/banner1.png"
                  className="h-full w-full object-cover"
                >
                  {shouldLoadVideo ? (
                    <source src="/introVid.mp4" type="video/mp4" />
                  ) : null}
                  Your browser does not support the video tag.
                </video>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#24461e]/82 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#f5d18a] backdrop-blur-md">
                  <Leaf className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Slow crafted
                </div>

                <div className="absolute bottom-4 left-4 right-16 sm:right-20">
                  <div className="inline-flex max-w-full rounded-[22px] border border-white/15 bg-black/35 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/88 backdrop-blur-md sm:text-xs">
                    Natural ingredients. Familiar taste. Everyday confidence.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute heritage video" : "Mute heritage video"}
                  className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-xl backdrop-blur-md transition hover:bg-black/70 active:scale-95"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" strokeWidth={2.3} />
                  ) : (
                    <Volume2 className="h-5 w-5" strokeWidth={2.3} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
