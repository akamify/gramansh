"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { subscribeNewsletter } from "@/app/lib/apiClient";

function SlowCraftSection() {
  const steps = [
    {
      num: "01",
      title: "Select clean ingredients",
      desc: "We focus on kitchen staples that start with natural sourcing and careful raw selection.",
    },
    {
      num: "02",
      title: "Prepare in a slower rhythm",
      desc: "Gram Ansh follows a more patient process so oils and masalas keep their depth and familiar aroma.",
    },
    {
      num: "03",
      title: "Deliver everyday trust",
      desc: "The final result is simple: products that feel dependable, pure, and ready for daily family cooking.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#234b1d_0%,#163319_100%)] py-10 text-white lg:py-20">
      <div className="pointer-events-none absolute -left-10 top-10 h-72 w-72 rounded-full bg-[#d79d44]/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/8 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <div className="space-y-3 sm:space-y-5">
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl">
                  <Image
                    src="/banner1.png"
                    alt="Gram Ansh banner detail"
                    width={1200}
                    height={900}
                    className="h-52 w-full object-cover object-left sm:h-72"
                  />
                </div>
                <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d79d44] text-[#163319]">
                    <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/78">
                    Every Gram Ansh batch is shaped around real kitchen use, not
                    just shelf appeal.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-8 sm:space-y-5 sm:pt-14">
                <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(215,157,68,0.18)_0%,rgba(255,255,255,0.06)_100%)] p-5 backdrop-blur-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#8c5f22]">
                    <Leaf className="h-5 w-5" strokeWidth={2.4} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/78">
                    Natural intent, balanced flavour, and a slower method that
                    keeps the product feeling grounded.
                  </p>
                </div>
                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl">
                  <Image
                    src="/gramansh.png"
                    alt="Gram Ansh branding"
                    width={1000}
                    height={1000}
                    className="h-56 w-full object-cover object-top sm:h-80"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#f5d18a]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.3} />
              Slow craft promise
            </div>

            <h2 className="text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              A cleaner process for a more{" "}
              <span className="text-[#f5d18a]">confident kitchen</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/74 md:text-base">
              Gram Ansh is designed around products that feel trustworthy from
              the moment they arrive in your pantry to the moment they are used
              in daily cooking.
            </p>

            <div className="mt-8 space-y-4">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm"
                >
                  <div className="flex gap-4">
                    <div className="text-3xl font-black leading-none text-[#f5d18a]/80">
                      {step.num}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-white/72">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#d79d44_0%,#b87922_100%)] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_16px_36px_rgba(122,67,18,0.28)] transition hover:brightness-105 active:scale-[0.98]"
              >
                Discover Gram Ansh
                <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setStatusType("error");
      setStatusMessage("Please enter your email.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage("");
      setStatusType("");
      await subscribeNewsletter(normalizedEmail, "homepage");
      setStatusType("success");
      setStatusMessage("Welcome to Gram Ansh. Please check your inbox.");
      setEmail("");
    } catch (subscribeError) {
      setStatusType("error");
      setStatusMessage(
        subscribeError instanceof Error
          ? subscribeError.message
          : "Could not subscribe right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[linear-gradient(180deg,#fffaf1_0%,#f2e7d3_100%)] py-10 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-[#dfd1b9] bg-[linear-gradient(135deg,#fffdf8_0%,#f7eedf_55%,#f0e1c4_100%)] px-5 py-12 shadow-[0_24px_70px_rgba(78,61,26,0.16)] lg:px-10 lg:py-16">
          <div className="pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-[#2b5a23]/8 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#d79d44]/12 blur-3xl" />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dfd1b9] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8c5f22]">
              <Mail className="h-3.5 w-3.5 text-[#2b5a23]" strokeWidth={2.3} />
              Join Gram Ansh updates
            </div>

            <h2 className="text-3xl font-black tracking-[-0.05em] text-[#24461e] md:text-5xl">
              Stay close to the next{" "}
              <span className="text-[#8c5f22]">Gram Ansh batch</span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6f5a44] md:text-base">
              Get product updates, pantry inspiration, and early access to
              fresh releases from Gram Ansh.
            </p>

            <form
              className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
              onSubmit={handleSubscribe}
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
                className="h-14 flex-1 rounded-full border border-[#ddcfb7] bg-white px-6 text-sm font-medium text-[#2f261d] outline-none transition focus:border-[#2b5a23] focus:ring-4 focus:ring-[#dfe9cf] placeholder:text-[#9e8b73]"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-14 rounded-full bg-[linear-gradient(135deg,#2b5a23_0%,#4b742f_100%)] px-8 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_16px_36px_rgba(43,90,35,0.22)] transition hover:brightness-105 disabled:opacity-60"
              >
                {isSubmitting ? "Joining..." : "Subscribe"}
              </button>
            </form>

            {statusMessage ? (
              <div
                className={`mt-6 inline-flex rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${
                  statusType === "error"
                    ? "border-[#e6b6ac] bg-[#fff1ee] text-[#9f3020]"
                    : "border-[#cfe1c7] bg-[#eef6ea] text-[#2b5a23]"
                }`}
              >
                {statusMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export { SlowCraftSection, NewsletterSection };
