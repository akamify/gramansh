import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

const HERO_IMAGE = "/banner2.png";

type HeroSectionProps = {
  initialBanners?: unknown[];
  managed?: boolean;
};

export default function HeroSection({}: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#f4efe4] px-1 py-1 sm:px-1.5 sm:py-1.5 lg:px-2 lg:py-2">
      {/* Subtle page background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-[#6f9754]/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#bd853b]/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1536px]">
        <div className="group overflow-hidden rounded-[5px] border border-[#d8cdb8] bg-[#fffdf8] shadow-[0_18px_55px_rgba(50,39,18,0.12)]">
          {/* Banner */}
          <div className="relative aspect-[3/1] w-full overflow-hidden bg-[#e9e1d2]">
            <Image
              src={HERO_IMAGE}
              alt="Gram Ansh cold pressed oils and natural masala products"
              fill
              priority
              fetchPriority="high"
              quality={100}
              sizes="(max-width: 1536px) 100vw, 1536px"
              className="object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.006]"
            />

            {/* Very light overlays only for a premium finish */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,transparent_28%,transparent_78%,rgba(19,45,18,0.08)_100%)]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-white/10 to-transparent"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-[12%] bg-gradient-to-l from-[#173716]/5 to-transparent"
            />
          </div>

          {/* Desktop bottom action strip */}
          <div className="hidden min-h-[70px] items-center border-t border-[#dfd3be] bg-[linear-gradient(90deg,#fffdf8_0%,#f8f1e5_48%,#fffdf8_100%)] sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4 sm:px-4 sm:py-2.5 lg:min-h-[76px] lg:gap-6 lg:px-6">
            {/* Trusted household essentials */}
            <div className="flex min-w-0 items-center justify-start">
              <div className="inline-flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7e1ce] bg-[#ebf2e5] text-[#2e652d]">
                  <ShieldCheck
                    className="h-[18px] w-[18px]"
                    strokeWidth={2.4}
                  />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-[#8a5a2d] lg:text-[10px]">
                    Trusted Household
                  </p>

                  <p className="mt-0.5 truncate text-[11px] font-extrabold text-[#284e24] lg:text-xs">
                    Natural everyday essentials
                  </p>
                </div>
              </div>
            </div>

            {/* Quality assured stays in the center */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3d5] bg-white/75 px-3.5 py-2 shadow-[0_7px_20px_rgba(45,66,30,0.06)] backdrop-blur-sm lg:px-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f1e2] text-[#2f652c]">
                  <BadgeCheck
                    className="h-4 w-4"
                    strokeWidth={2.5}
                  />
                </span>

                <span className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.17em] text-[#725033] lg:text-[10px]">
                  Quality Assured
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <Link
                href="/shop"
                aria-label="Shop Gram Ansh products"
                className="group/button inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#245b25_0%,#39752f_100%)] px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[0_10px_25px_rgba(35,84,34,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(35,84,34,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c7433] focus-visible:ring-offset-2 active:translate-y-0 lg:min-h-12 lg:px-5 lg:text-[11px]"
              >
                <ShoppingBag
                  className="h-4 w-4 shrink-0"
                  strokeWidth={2.5}
                />

                <span className="whitespace-nowrap">Shop Now</span>

                <ArrowRight
                  className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/button:translate-x-1"
                  strokeWidth={2.6}
                />
              </Link>

              <Link
                href="/shop"
                aria-label="Explore all Gram Ansh product ranges"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-[#d3c2a4] bg-white px-4 text-[9px] font-black uppercase tracking-[0.12em] text-[#704722] shadow-[0_8px_20px_rgba(63,48,23,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#af7c3c] hover:bg-[#fffdf8] hover:text-[#2d5d29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b07b3d] focus-visible:ring-offset-2 active:translate-y-0 lg:min-h-12 lg:px-5 lg:text-[10px]"
              >
                Explore Range
              </Link>
            </div>
          </div>

          {/* Mobile bottom content */}
          <div className="border-t border-[#e2d6c2] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f1e5_100%)] p-2.5 sm:hidden">
            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#dfd5c3] bg-white/80 px-2.5 py-2 shadow-[0_5px_15px_rgba(56,43,20,0.05)]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2e4] text-[#30642d]">
                  <ShieldCheck
                    className="h-4 w-4"
                    strokeWidth={2.4}
                  />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[7px] font-black uppercase tracking-[0.12em] text-[#98622d]">
                    Trusted Household
                  </p>

                  <p className="mt-0.5 truncate text-[9px] font-extrabold text-[#31552a]">
                    Essentials
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#dfd5c3] bg-white/80 px-2.5 py-2 shadow-[0_5px_15px_rgba(56,43,20,0.05)]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2e4] text-[#30642d]">
                  <BadgeCheck
                    className="h-4 w-4"
                    strokeWidth={2.5}
                  />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[7px] font-black uppercase tracking-[0.12em] text-[#98622d]">
                    Carefully Selected
                  </p>

                  <p className="mt-0.5 truncate text-[9px] font-extrabold text-[#31552a]">
                    Quality Assured
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="mt-2.5 grid grid-cols-[1.15fr_1fr] gap-2">
              <Link
                href="/shop"
                aria-label="Shop Gram Ansh products"
                className="group/button inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#245b25_0%,#3e7933_100%)] px-3 text-[9px] font-black uppercase tracking-[0.11em] text-white shadow-[0_10px_22px_rgba(35,84,34,0.25)] transition-transform active:scale-[0.98]"
              >
                <ShoppingBag
                  className="h-3.5 w-3.5 shrink-0"
                  strokeWidth={2.5}
                />

                <span className="whitespace-nowrap">Shop Now</span>

                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/button:translate-x-0.5"
                  strokeWidth={2.6}
                />
              </Link>

              <Link
                href="/shop"
                aria-label="Explore all Gram Ansh product ranges"
                className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-[#d3c2a5] bg-white px-2 text-[8px] font-black uppercase tracking-[0.1em] text-[#704722] shadow-[0_6px_16px_rgba(63,48,23,0.07)] transition-transform active:scale-[0.98]"
              >
                Explore Range
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}