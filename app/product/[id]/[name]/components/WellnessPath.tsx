"use client";
import React from "react";

export default function WellnessPath() {
  return (
    <section className="mt-14 lg:mt-24 pb-8 border-b border-outline-variant/20">
      <h3 className="font-headline text-4xl font-bold text-primary mb-3 lg:mb-12 text-center">The Gram Ansh Quality Path</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-surface-container-low p-4 lg:p-8 rounded-3xl space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
          <span className="material-symbols-outlined text-3xl text-secondary">health_and_safety</span>
          <h4 className="font-bold text-lg text-on-surface">Purity First</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed font-body">
            Our approach centers on clean ingredients and a preparation style that keeps the final product dependable for daily use.
          </p>
        </div>
        <div className="bg-surface-container-low p-4 lg:p-8 rounded-3xl space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
          <span className="material-symbols-outlined text-3xl text-secondary">bolt</span>
          <h4 className="font-bold text-lg text-on-surface">Balanced Flavor</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed font-body">
            Gram Ansh products are made to feel rich, familiar, and naturally suited to everyday Indian cooking.
          </p>
        </div>
        <div className="bg-surface-container-low p-4 lg:p-8 rounded-3xl space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
          <span className="material-symbols-outlined text-3xl text-secondary">vital_signs</span>
          <h4 className="font-bold text-lg text-on-surface">Natural Selection</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed font-body">
            We prioritize ingredients that align with a cleaner pantry and a more mindful kitchen routine.
          </p>
        </div>
        <div className="bg-surface-container-low p-4 lg:p-8 rounded-3xl space-y-4 hover:shadow-lg hover:-translate-y-1 transition-all">
          <span className="material-symbols-outlined text-3xl text-secondary">vital_signs</span>
          <h4 className="font-bold text-lg text-on-surface">Kitchen Trust</h4>
          <p className="text-on-surface-variant text-sm leading-relaxed font-body">
            The end result is simple: products you can reach for confidently, every single day.
          </p>
        </div>
      </div>
    </section>
  );
}
