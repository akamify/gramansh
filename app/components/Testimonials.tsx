"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Star } from "lucide-react";
import {
  fetchPublicTestimonialsData,
  type PublicTestimonial,
} from "../lib/publicDataClient";
import { TestimonialsGridSkeleton } from "./Skeletons";

type TestimonialItem = {
  id?: string | number;
  quote: string;
  name: string;
  role: string;
};

const FALLBACK_TESTIMONIALS: TestimonialItem[] = [];
const TESTIMONIALS_STORAGE_KEY = "sr_testimonials";
const TESTIMONIALS_CACHE_TIME = 5 * 60 * 1000;

function TestimonialsSection({
  initialTestimonials = [],
  managed = false,
}: {
  initialTestimonials?: PublicTestimonial[];
  managed?: boolean;
}) {
  const getCachedTestimonials = (): TestimonialItem[] | null => {
    if (typeof window === "undefined") return null;

    try {
      const cached = window.localStorage.getItem(TESTIMONIALS_STORAGE_KEY);
      if (!cached) return null;
      const data = JSON.parse(cached);

      if (
        data.timestamp &&
        Date.now() - data.timestamp < TESTIMONIALS_CACHE_TIME
      ) {
        return data.testimonials;
      }

      return null;
    } catch {
      return null;
    }
  };

  const [fetchedTestimonials, setFetchedTestimonials] = useState<
    TestimonialItem[] | null
  >(() => getCachedTestimonials());
  const [isLoading, setIsLoading] = useState(
    initialTestimonials.length === 0 && !managed && getCachedTestimonials() === null,
  );
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const saveToCache = (items: TestimonialItem[]) => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        TESTIMONIALS_STORAGE_KEY,
        JSON.stringify({
          testimonials: items,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // ignore cache failures
    }
  };

  useEffect(() => {
    if (managed) return;

    const cached = fetchedTestimonials;

    fetchPublicTestimonialsData()
      .then((rowsUnknown) => {
        if (!Array.isArray(rowsUnknown) || rowsUnknown.length === 0) return;

        type RawRow = {
          id: string | number;
          quote: string;
          name: string;
          role?: string | null;
        };

        const rows = rowsUnknown as RawRow[];
        const mappedTestimonials = rows.map((row) => ({
          id: row.id,
          quote: row.quote,
          name: row.name,
          role: row.role || "Gram Ansh customer",
        }));

        setFetchedTestimonials(mappedTestimonials);
        saveToCache(mappedTestimonials);
      })
      .catch(() => {
        if (!cached || cached.length === 0) {
          setFetchedTestimonials(FALLBACK_TESTIMONIALS);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fetchedTestimonials, managed]);

  const testimonials =
    initialTestimonials.length > 0
      ? initialTestimonials.map((item) => ({
          id: item.id,
          quote: item.quote,
          name: item.name,
          role: item.role || "Gram Ansh customer",
        }))
      : managed
        ? FALLBACK_TESTIMONIALS
        : (fetchedTestimonials ?? FALLBACK_TESTIMONIALS);

  const updateScrollControls = () => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth - 2);
    setCanScrollPrev(track.scrollLeft > 2);
    setCanScrollNext(track.scrollLeft < maxScroll);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollControls();

    const onScroll = () => updateScrollControls();
    const onResize = () => updateScrollControls();

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [testimonials.length, isLoading]);

  const scrollTrack = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector<HTMLElement>("[data-testimonial-card]");
    const cardWidth = card?.offsetWidth ?? 0;
    const step = cardWidth + 24;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

    const nextLeft =
      direction === "next"
        ? Math.min(track.scrollLeft + step, maxScroll)
        : Math.max(track.scrollLeft - step, 0);

    track.scrollTo({ left: nextLeft, behavior: "smooth" });
    window.setTimeout(updateScrollControls, 350);
  };

  const controlsVisible = canScrollPrev || canScrollNext;

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f0e1_0%,#fffdf8_100%)] py-10 lg:py-20">
      <div className="pointer-events-none absolute left-0 top-20 h-64 w-64 rounded-full bg-[#d79d44]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#2b5a23]/8 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dfd1b9] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8c5f22]">
              <MessageCircle className="h-3.5 w-3.5 text-[#2b5a23]" strokeWidth={2.4} />
              Community voices
            </div>

            <h2 className="text-3xl font-black tracking-[-0.05em] text-[#24461e] md:text-5xl">
              Families choosing <span className="text-[#8c5f22]">Gram Ansh</span>
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#6f5a44] md:text-base">
              Real feedback from customers who value natural ingredients,
              traditional flavour, and kitchen trust.
            </p>
          </div>

          {controlsVisible ? (
            <div className="flex gap-3">
              <button
                onClick={() => scrollTrack("prev")}
                disabled={!canScrollPrev}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#d9ccb5] bg-white text-[#24461e] shadow-[0_10px_24px_rgba(92,72,31,0.08)] transition hover:border-[#b87922] hover:text-[#8c5f22] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous testimonial"
                type="button"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
              </button>
              <button
                onClick={() => scrollTrack("next")}
                disabled={!canScrollNext}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#d9ccb5] bg-white text-[#24461e] shadow-[0_10px_24px_rgba(92,72,31,0.08)] transition hover:border-[#b87922] hover:text-[#8c5f22] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next testimonial"
                type="button"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative overflow-hidden">
          {isLoading ? (
            <TestimonialsGridSkeleton count={3} />
          ) : testimonials.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#e6d7c1] bg-white px-5 py-14 text-center">
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#f5efe4] text-[#8c5f22]">
                <MessageCircle className="h-8 w-8" strokeWidth={2.1} />
              </div>
              <h3 className="text-2xl font-black tracking-[-0.03em] text-[#24461e] md:text-3xl">
                No testimonials yet
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#7b6a56]">
                Be the first to share your experience with Gram Ansh and help
                others discover the taste of natural pantry essentials.
              </p>
            </div>
          ) : (
            <div
              ref={trackRef}
              className="testimonials-track flex gap-4 overflow-x-auto scroll-smooth pb-2 lg:gap-6"
            >
              {testimonials.map((t, index) => (
                <article
                  key={t.id || `${t.name}-${index}`}
                  data-testimonial-card
                  className="flex min-h-[280px] shrink-0 flex-col justify-between rounded-[30px] border border-[#eadfcd] bg-white p-6 shadow-[0_14px_35px_rgba(87,67,25,0.05)] sm:min-h-[270px] sm:[flex:0_0_78%] md:[flex:0_0_48%] lg:min-h-[300px] lg:[flex:0_0_32%]"
                >
                  <div>
                    <div className="mb-5 flex items-center gap-1.5 text-[#d79d44]">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Star
                          key={star}
                          className="h-4 w-4 fill-current"
                          strokeWidth={1.8}
                        />
                      ))}
                    </div>

                    <p className="text-base italic leading-8 text-[#3c3228] md:text-lg">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-3 border-t border-[#efe4d4] pt-4">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#2b5a23_0%,#4b742f_100%)] text-lg font-black text-white shadow-[0_10px_24px_rgba(43,90,35,0.2)]"
                      aria-hidden="true"
                    >
                      {t.name.trim().charAt(0).toLocaleUpperCase() || "?"}
                    </div>

                    <div className="min-w-0">
                      <h5 className="truncate text-sm font-black text-[#24461e] md:text-base">
                        {t.name}
                      </h5>
                      <span className="mt-0.5 block truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[#8c5f22]">
                        {t.role || "Gram Ansh family"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .testimonials-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior-x: contain;
        }

        .testimonials-track::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        @media (max-width: 639px) {
          [data-testimonial-card] {
            flex: 0 0 88%;
          }
        }
      `}</style>
    </section>
  );
}

export default TestimonialsSection;
