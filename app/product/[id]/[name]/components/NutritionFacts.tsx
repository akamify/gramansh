"use client";

import React from "react";
import type { Product } from "@/app/data/products";

type DetailRow = { key: string; value: string };

function fallbackFromDetails(details?: string[], emptyKey = "Details"): DetailRow[] {
  return (Array.isArray(details) ? details : [])
    .map((item) => {
      const [key, ...rest] = String(item).split(":");
      return {
        key: String(key || emptyKey).trim(),
        value: String(rest.join(":") || "-").trim() || "-",
      };
    })
    .filter((item) => item.key || item.value);
}

export default function NutritionFacts({ product }: { product?: Product | null }) {
  const description = product?.description ?? "No description available.";
  const ingredients =
    Array.isArray(product?.ingredients) && product.ingredients.length > 0
      ? product.ingredients
      : fallbackFromDetails(product?.details, "Blend");
  const kitchenNotes =
    Array.isArray(product?.nutritions) && product.nutritions.length > 0
      ? product.nutritions
      : fallbackFromDetails(product?.details, "Kitchen note");
  const specifications =
    Array.isArray(product?.specifications) && product.specifications.length > 0
      ? product.specifications
      : [{ key: "Storage", value: "Refer to product pack" }];

  return (
    <section className="mt-12 grid grid-cols-1 gap-8 border-b border-outline-variant/20 pb-8 lg:mt-16 xl:grid-cols-[1.18fr_0.82fr]">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">
            Product Profile
          </p>
          <h3 className="font-headline text-4xl font-bold text-primary">
            Blend, Purity & Kitchen Notes
          </h3>
        </div>

        <p className="text-lg leading-relaxed text-on-surface font-body">
          {description}
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-low p-6">
            <h4 className="font-headline text-2xl font-bold text-primary">
              Blend & Ingredients
            </h4>
            <div className="mt-5 space-y-4">
              {ingredients.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="flex items-center justify-between border-b border-outline-variant/30 py-3"
                >
                  <span className="font-body font-bold text-on-surface">{item.key}</span>
                  <span className="max-w-[55%] text-right font-headline font-bold italic text-secondary">
                    {item.value || "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-outline-variant/20 bg-surface-container-low p-6">
            <h4 className="font-headline text-2xl font-bold text-primary">
              Kitchen Notes
            </h4>
            <div className="mt-5 space-y-4">
              {kitchenNotes.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="flex justify-between border-b border-outline-variant/30 pb-3"
                >
                  <span className="font-bold text-on-surface">{item.key}</span>
                  <span className="max-w-[55%] text-right">{item.value || "-"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border-l-[4px] border-primary bg-primary/5 p-6">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            format_quote
          </span>
          <span className="text-sm italic leading-relaxed text-primary font-body">
            "Every Gram Ansh product is described around real kitchen use, cleaner inputs, and everyday pantry trust."
          </span>
        </div>
      </div>

      <div className="rounded-[2.5rem] bg-surface-container-highest p-8 shadow-sm">
        <h4 className="mb-2 font-headline text-2xl font-bold text-primary">
          Storage & Shelf Life
        </h4>
        <div className="mb-6 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Packed for everyday use
        </div>
        <div className="space-y-4 text-sm font-label">
          {specifications.map((item, index) => (
            <div
              key={`${item.key}-${index}`}
              className="flex justify-between border-b border-outline-variant/40 pb-3"
            >
              <span className="font-bold text-on-surface">{item.key}</span>
              <span className="max-w-[55%] text-right">{item.value || "-"}</span>
            </div>
          ))}
          <div className="mt-6 text-[10px] italic text-on-surface-variant font-body">
            Product-specific storage, shelf life, and best-use guidance appears here when provided from admin.
          </div>
        </div>
      </div>
    </section>
  );
}
