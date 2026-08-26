"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf, ShoppingBag, Sparkles } from "lucide-react";
import ResilientProductImage from "@/app/components/ResilientProductImage";
import { useCart } from "@/app/context/CartContext";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";
import {
  createProductHref,
  getProductImageSources,
  type Product,
} from "@/app/data/products";
import { peekCached, putCached } from "@/app/lib/clientCache";
import { flyImageToCart } from "@/app/lib/flyToCart";
import { fetchFeaturedProducts } from "@/app/lib/productsClient";

function formatMoney(currencySymbol: string, value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  return `${currencySymbol}${amount.toLocaleString()}`;
}

function discountPct(original: number | undefined, selling: number) {
  if (!original || original <= selling) return 0;
  return Math.min(95, Math.round(((original - selling) / original) * 100));
}

const spotlightGridClass =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export default function SpotlightProductsSection({
  initialProducts = [],
  managed = false,
  loading: externalLoading,
}: {
  initialProducts?: Product[];
  managed?: boolean;
  loading?: boolean;
}) {
  const router = useRouter();
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(() => {
    const cached = peekCached<Product[]>("products:all").data;
    return Array.isArray(cached) && cached.length ? cached : null;
  });
  const [isFetching, setIsFetching] = useState(
    initialProducts.length === 0 && !managed && fetchedProducts === null,
  );

  const { addItem, isVariantInCart } = useCart();
  const { settings } = useSiteSettings();

  const currencySymbol = settings.currencySymbol || "\u20B9";

  useEffect(() => {
    if (managed || initialProducts.length > 0) return;

    fetchFeaturedProducts()
      .then((data) => {
        putCached("products:all", 5 * 60 * 1000, data);
        setFetchedProducts(data);
      })
      .catch(() => {
        setFetchedProducts((current) => current);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [initialProducts.length, managed]);

  const products = useMemo(
    () =>
      initialProducts.length > 0
        ? initialProducts
        : managed
          ? []
          : (fetchedProducts ?? []),
    [fetchedProducts, initialProducts, managed],
  );
  const loading =
    initialProducts.length > 0
      ? false
      : managed
        ? Boolean(externalLoading)
        : isFetching && products.length === 0;
  const spotlight = useMemo(() => products.slice(0, 8), [products]);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#f5eddc_100%)] py-10 lg:py-20">
      <div className="pointer-events-none absolute left-0 top-10 h-64 w-64 rounded-full bg-[#d79d44]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#2b5a23]/8 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mb-8 rounded-[30px] border border-[#e6d7c1] bg-white/72 p-5 shadow-[0_18px_50px_rgba(92,72,31,0.08)] backdrop-blur-sm lg:mb-12 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d9ccb5] bg-[#fbf5e8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#2b5a23]">
                <Sparkles className="h-3.5 w-3.5 text-[#b87922]" strokeWidth={2.3} />
                Gram Ansh spotlight
              </div>

              <h2 className="text-3xl font-black tracking-[-0.05em] text-[#24461e] md:text-5xl">
                Best of <span className="text-[#8c5f22]">Gram Ansh</span>
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#6f5a44] md:text-base">
                Freshly chosen oils and masalas for everyday cooking, rooted in
                natural ingredients and clean, traditional preparation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {["Cold pressed", "No harsh additives", "Kitchen essentials"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[#e5d7bf] bg-white px-3 py-1.5 text-[11px] font-bold text-[#7a4312]"
                  >
                    {label}
                  </span>
                ),
              )}

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2b5a23_0%,#4b742f_100%)] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_12px_30px_rgba(43,90,35,0.2)] transition hover:brightness-105"
              >
                Explore Shop
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={spotlightGridClass}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[28px] border border-[#eadfcd] bg-white p-4 shadow-[0_14px_35px_rgba(87,67,25,0.05)]"
              >
                <div className="aspect-[4/4.4] animate-pulse rounded-[22px] bg-[linear-gradient(135deg,#f5efe4_0%,#ece4d2_100%)]" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-[#ece4d2]" />
                <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-[#f2ead8]" />
                <div className="mt-5 h-11 animate-pulse rounded-2xl bg-[#ece4d2]" />
              </div>
            ))}
          </div>
        ) : spotlight.length === 0 ? (
          <div className="rounded-[28px] border border-[#e6d7c1] bg-white px-6 py-14 text-center text-sm font-medium text-[#7b6a56]">
            Gram Ansh products are being refreshed. Please check back shortly.
          </div>
        ) : (
          <div className={spotlightGridClass}>
            {spotlight.map((product) => {
              const primary =
                Array.isArray(product.variants) && product.variants.length > 0
                  ? product.variants[0]
                  : undefined;

              const displayPrice = Number(product.price ?? primary?.price ?? 0);
              const displayOriginal =
                product.originalPrice ?? primary?.originalPrice;
              const weightLabel = primary?.label ?? product.sizes?.[0] ?? "";
              const inStock = (primary?.stock ?? product.quantity ?? 0) > 0;
              const inCart = isVariantInCart(product.id, weightLabel || "");
              const pct = discountPct(displayOriginal, displayPrice);
              const imageSources = getProductImageSources(product, weightLabel);

              return (
                <article
                  key={product.id}
                  data-product-card
                  className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#eadfcd] bg-white p-4 shadow-[0_14px_35px_rgba(87,67,25,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(87,67,25,0.12)]"
                >
                  <Link
                    href={createProductHref(product)}
                    className="relative block aspect-[4/4.4] overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#faf5ea_0%,#efe5d2_100%)]"
                  >
                    {imageSources.length > 0 ? (
                      <ResilientProductImage
                        sources={imageSources}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : null}

                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/25 to-transparent" />

                    {pct > 0 ? (
                      <div className="absolute left-3 top-3 rounded-full bg-[#24461e] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                        {pct}% Off
                      </div>
                    ) : (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2b5a23] backdrop-blur-sm">
                        <Leaf className="h-3 w-3 text-[#b87922]" strokeWidth={2.4} />
                        Natural
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col px-1 pt-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-black leading-snug text-[#2f261d] transition-colors group-hover:text-[#2b5a23]">
                        {product.name}
                      </h3>

                      {weightLabel ? (
                        <span className="shrink-0 rounded-full bg-[#f7f1e6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8c5f22]">
                          {weightLabel}
                        </span>
                      ) : null}
                    </div>

                    <p className="mb-5 line-clamp-2 text-sm leading-6 text-[#7b6a56]">
                      {product.description || "Pure kitchen essentials with a clean, traditional touch."}
                    </p>

                    <div className="mt-auto flex items-end justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-lg font-black text-[#24461e]">
                            {formatMoney(currencySymbol, displayPrice)}
                          </div>
                          {displayOriginal && displayOriginal > displayPrice ? (
                            <div className="text-xs font-medium text-[#ad8f71] line-through">
                              {formatMoney(currencySymbol, displayOriginal)}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-xs font-medium text-[#8c5f22]">
                          Gram Ansh quality pick
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();

                          if (inCart) {
                            router.push("/cart");
                            return;
                          }

                          if (!inStock) return;

                          let renderedImageUrl = product.image || "";

                          try {
                            const card = (
                              event.currentTarget as HTMLElement | null
                            )?.closest?.("[data-product-card]") as HTMLElement | null;
                            const img = card?.querySelector?.("img") as HTMLImageElement | null;
                            const fromRect =
                              img?.getBoundingClientRect?.() ??
                              (event.currentTarget as HTMLElement).getBoundingClientRect();
                            const imageUrl = String(
                              img?.currentSrc || img?.src || product.image || "",
                            ).trim();

                            renderedImageUrl = imageUrl || renderedImageUrl;

                            if (imageUrl && fromRect) {
                              flyImageToCart({
                                imageUrl,
                                fromRect,
                                durationMs: 950,
                              });
                            }
                          } catch {
                            // Ignore animation failure.
                          }

                          addItem({
                            id: product.id,
                            name: product.name,
                            price: displayPrice,
                            color: "",
                            size: weightLabel || "",
                            image: renderedImageUrl,
                            collection: product.collection || "",
                          });
                        }}
                        disabled={!inStock && !inCart}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-[0.13em] transition active:scale-[0.98] ${
                          inCart
                            ? "bg-[#2f261d] text-white hover:bg-black"
                            : "bg-[linear-gradient(135deg,#d79d44_0%,#b87922_100%)] text-white hover:brightness-105 disabled:bg-[#e7dece] disabled:text-[#9e8b73]"
                        }`}
                      >
                        <ShoppingBag className="h-4 w-4" strokeWidth={2.4} />
                        {inCart ? "Go Cart" : inStock ? "Add" : "Sold Out"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
