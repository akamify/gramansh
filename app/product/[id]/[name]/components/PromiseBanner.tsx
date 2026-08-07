"use client";
import React from "react";

export default function PromiseBanner() {
  return (
    <section className="mt-20 lg:mt-32 text-center py-5 lg:py-20 bg-primary rounded-[3rem] text-on-primary overflow-hidden relative shadow-2xl mb-12">
      <div className="absolute inset-0 opacity-15">
        <img
          className="w-full h-full object-cover mix-blend-overlay"
          alt="Sugarcane fields"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIT73m22AdwkyyLn0ReLtpd2TMhCXJU2lfmChTqN3hrBmuQiAxSOZqS1ly6PJ4NRTvuoXG631ndyNuCG8NfC6Vmf_lHqpJOLLZTlcjmyFx1KlKng15dTFU2H9DPrX6oAzvTba40Y24sCIWa7pfulxm8_n-x_BV-nV3lHjXadhW96d35VlOMDPFUfZGVGSx3lcb5p2JXTe6s2JJLn5ZzmkbdlzJzGDHDdiAXxRNVwccZ5SZ7d-5lxkUG3lcXxOoKtwQoF-jQ6ezwCY"
        />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <span className="font-label uppercase tracking-[0.3em] text-xs font-bold text-secondary">Our Promise</span>
        <h2 className="font-headline text-4xl md:text-5xl mt-6 mb-8 leading-tight italic font-bold">
          Crafted for the modern home, rooted in ancient soil.
        </h2>
        <p className="font-body text-primary-fixed opacity-90 mb-12 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Every Gram Ansh product reflects our ingredient-first approach. We focus on honest sourcing, clean preparation, and natural flavour without unnecessary additives.
        </p>
        <div className="flex justify-center gap-12 md:gap-20 border-t border-white/20 pt-10">
          <div className="text-center">
            <div className="text-3xl font-headline italic font-bold mb-2">24k</div>
            <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold opacity-80 text-secondary">Quality Grade</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-headline italic font-bold mb-2">100%</div>
            <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold opacity-80 text-secondary">Natural</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-headline italic font-bold mb-2">Small</div>
            <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold opacity-80 text-secondary">Batch Yield</div>
          </div>
        </div>
      </div>
    </section>
  );
}
