"use client";

import React from "react";
import Link from "next/link";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";
import { getWholesaleWhatsAppUrl } from "@/app/lib/whatsapp";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

const WHOLESALE_WHATSAPP_URL = getWholesaleWhatsAppUrl();
const BRAND_NAME = "Gram Ansh";
const BRAND_TAGLINE = "Cold Press Oil & Natural Masala";

type FooterLinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

type SocialItem = {
  label: string;
  href?: string | null;
  icon: "facebook" | "instagram" | "youtube";
};

const footerLinks: Record<string, FooterLinkItem[]> = {
  Explore: [
    { label: "Shop All", href: "/shop" },
    { label: "My Orders", href: "/user/orders" },
    { label: "Wishlist", href: "/user/wishlist" },
  ],
  Support: [
    { label: "Shipping", href: "/shipping" },
    { label: "Contact", href: "/contact" },
    { label: "Wholesale", href: WHOLESALE_WHATSAPP_URL, external: true },
  ],
  Policies: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
};

function SocialIcon({
  type,
  className,
}: {
  type: SocialItem["icon"];
  className?: string;
}) {
  const baseProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  if (type === "facebook") {
    return (
      <svg {...baseProps}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg {...baseProps}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...baseProps}>
      <path d="M22 8.5s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1-3.1-.2-7.8-.2-7.8-.2h-.1s-4.7 0-7.8.2c-.4.1-1.3.1-2.1 1-.6.7-.8 2.3-.8 2.3S0 10.4 0 12v.1c0 1.6.2 3.5.2 3.5s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.8.2 7.6.2 7.6.2s4.7 0 7.8-.2c.4-.1 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.9.2-3.5V12c0-1.6-.2-3.5-.2-3.5z" />
      <path d="M10 15.5V8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SocialLink({ item }: { item: SocialItem }) {
  if (!item.href) return null;

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={item.label}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6 text-[#f7f1e6]/70 transition hover:border-[#d79d44] hover:text-[#f5d18a]"
    >
      <SocialIcon type={item.icon} className="h-5 w-5" />
    </a>
  );
}

export default function Footer() {
  const { settings } = useSiteSettings();

  const socialLinks: SocialItem[] = [
    { icon: "facebook", href: settings.facebookUrl, label: "Facebook" },
    { icon: "instagram", href: settings.instagramUrl, label: "Instagram" },
    { icon: "youtube", href: settings.youtubeUrl, label: "YouTube" },
  ];

  return (
    <footer
      className="relative mt-16 overflow-hidden rounded-t-[2.5rem] bg-[linear-gradient(180deg,#234b1d_0%,#163319_100%)] text-[#f7f1e6] md:rounded-t-[4rem]"
      data-site-footer
    >
      <div
        data-footer-sentinel
        className="pointer-events-none absolute left-0 top-0 h-px w-full opacity-0"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute -left-12 top-8 h-72 w-72 rounded-full bg-[#d79d44]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/8 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-6 py-14 lg:px-12 lg:py-20">
        <div className="mb-12 grid gap-8 rounded-[34px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-sm lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <div className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#f5d18a]">
              Gram Ansh kitchen promise
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              Natural pantry essentials for everyday homes
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              {settings.footerDescription ||
                "Gram Ansh brings together cold press oils and natural masalas shaped around purity, flavour, and dependable everyday cooking."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={WHOLESALE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(215,157,68,0.22)_0%,rgba(255,255,255,0.08)_100%)] p-5 transition hover:border-[#d79d44]/40"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5d18a]">
                Wholesale
              </div>
              <div className="mt-2 text-lg font-black text-white">
                Bulk orders for stores & families
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white/82">
                Connect now
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
              </div>
            </a>

            <Link
              href="/shop"
              className="rounded-[26px] border border-white/10 bg-white/8 p-5 transition hover:border-white/20"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5d18a]">
                Explore
              </div>
              <div className="mt-2 text-lg font-black text-white">
                Discover the Gram Ansh range
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white/82">
                Visit shop
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <span className="block text-3xl font-black tracking-[-0.05em] text-[#f5d18a] md:text-4xl">
              {BRAND_NAME}
            </span>
            <span className="mt-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
              {BRAND_TAGLINE}
            </span>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/70">
              Purely crafted ingredients, earthy flavour, and a design language
              rooted in the warmth of the Gram Ansh kitchen.
            </p>

            <div className="mt-8 flex gap-3">
              {socialLinks.map((item) => (
                <SocialLink key={item.label} item={item} />
              ))}
            </div>

            <div className="mt-8 space-y-3">
              {settings.companyEmail ? (
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <Mail size={15} className="text-[#f5d18a]" />
                  <span>{settings.companyEmail}</span>
                </div>
              ) : null}

              {settings.companyPhone ? (
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <Phone size={15} className="text-[#f5d18a]" />
                  <span>{settings.companyPhone}</span>
                </div>
              ) : null}

              {settings.companyAddress ? (
                <div className="flex items-start gap-3 text-sm text-white/70">
                  <MapPin size={15} className="mt-1 shrink-0 text-[#f5d18a]" />
                  <span className="leading-7">{settings.companyAddress}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8 lg:pl-10">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="flex flex-col gap-6">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#f5d18a]/80">
                  {category}
                </span>

                <ul className="flex flex-col gap-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-white/66 transition hover:text-white"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-2 text-sm font-medium text-white/66 transition hover:text-white"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 bg-black/10">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-center lg:flex-row lg:px-12 lg:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45 md:text-xs">
            {"\u00A9"} 2026 <span className="text-white/72">{BRAND_NAME}</span>. Cold Press Oil & Natural Masala.
          </p>

          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35 md:text-xs">
            Made for everyday kitchens with natural intent.
          </p>

         <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45 md:text-[10px]">
  Tech Support by{" "}
  <span className="text-white/72">AKAMIFY</span>
  {" • "}
  <br />
  Marketing by{" "}
  <span className="text-white/72">Digital Adbird</span>
</p>
        </div>
      </div>
    </footer>
  );
}
