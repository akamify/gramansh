"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
} from "lucide-react";
import ResilientProductImage from "@/app/components/ResilientProductImage";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";
import {
  createProductHref,
  getProductImageSources,
  type Product,
} from "@/app/data/products";
import { peekCached, putCached } from "@/app/lib/clientCache";
import { fetchFeaturedProducts } from "@/app/lib/productsClient";

function FeaturedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-[#eadfcd] bg-white p-4 shadow-[0_14px_35px_rgba(87,67,25,0.05)]">
      <div className="aspect-[4/4.6] animate-pulse rounded-[24px] bg-[linear-gradient(135deg,#f5efe4_0%,#ece4d2_100%)]" />
      <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-[#ece4d2]" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#f5efe4]" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[#f5efe4]" />
      <div className="mt-5 h-11 animate-pulse rounded-2xl bg-[#ece4d2]" />
    </div>
  );
}

export default function FeaturedProductsSection({
  initialProducts = [],
  managed = false,
  loading: externalLoading,
}: {
  initialProducts?: Product[];
  managed?: boolean;
  loading?: boolean;
}) {
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(() => {
    const cached = peekCached<Product[]>("products:all").data;
    return Array.isArray(cached) && cached.length ? cached : null;
  });
  const [isFetching, setIsFetching] = useState(
    initialProducts.length === 0 && !managed && fetchedProducts === null,
  );
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
      .finally(() => setIsFetching(false));
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
  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <section className="overflow-hidden bg-[#fcf8f0] py-10 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8 rounded-[30px] border border-[#e7d8bd] bg-[linear-gradient(135deg,rgba(255,252,245,0.95)_0%,rgba(246,237,220,0.86)_100%)] p-5 shadow-[0_20px_50px_rgba(92,72,31,0.08)] lg:mb-12 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dfd1b9] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8c5f22]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2b5a23]" strokeWidth={2.4} />
              Featured range
              </div>

              <h2 className="max-w-3xl text-3xl font-black tracking-[-0.05em] text-[#24461e] md:text-5xl">
                Crafted for the <span className="text-[#8c5f22]">Gram Ansh</span> kitchen
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f5a44] md:text-base">
                A sleek curation of pantry staples designed around purity,
                tradition, and everyday modern cooking with trusted masalas and
                cold-pressed essentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {["Daily staples", "Pure ingredients", "Trusted kitchen picks"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[#dbc8a7] bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#7a4312]"
                >
                  {label}
                </span>
              ))}

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-[#d9ccb5] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#6f4117] shadow-[0_10px_24px_rgba(92,72,31,0.08)] transition hover:bg-[#fffaf0]"
              >
                View Collection
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <FeaturedCardSkeleton key={index} />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-[28px] border border-[#e6d7c1] bg-white px-6 py-14 text-center text-sm font-medium text-[#7b6a56]">
            Featured products are being updated. Please check again shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                data-featured-card
              >
                <ProductCard product={product} currency={currencySymbol} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  currency,
}: {
  product: Product;
  currency: string;
}) {
  const primary = product.variants?.[0];
  const price = Number(product.price ?? primary?.price ?? 0);
  const oldPrice = product.originalPrice ?? primary?.originalPrice;
  const isSale = Boolean(oldPrice && oldPrice > price);
  const imageSources = getProductImageSources(product);
  const productHref = createProductHref(product);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#eadfcd] bg-white p-4 shadow-[0_14px_35px_rgba(87,67,25,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(87,67,25,0.12)]">
      <Link
        href={productHref}
        className="relative block aspect-[4/4.6] overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,#fffdf7,transparent_45%),linear-gradient(180deg,#fffef9,#efe2cc)]"
        aria-label={`Open ${product.name}`}
      >
        {isSale ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-[#24461e] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
            Sale
          </div>
        ) : (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2b5a23] backdrop-blur-sm">
            <Leaf className="h-3 w-3 text-[#b87922]" strokeWidth={2.4} />
            Pure
          </div>
        )}

        {imageSources.length > 0 ? (
          <ResilientProductImage
            sources={imageSources}
            alt={product.name}
            className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/12 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="w-full translate-y-3 rounded-2xl bg-white/90 py-3 text-center text-sm font-black text-[#24461e] shadow-xl backdrop-blur-md transition-transform duration-500 group-hover:translate-y-0">
            Explore Product
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-5">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h3 className="line-clamp-1 text-xl font-black tracking-[-0.03em] text-[#2f261d] transition-colors group-hover:text-[#2b5a23]">
            {product.name}
          </h3>

          <div className="flex shrink-0 flex-col items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-[#24461e]">
                {currency}
                {price}
              </span>
              {isSale ? (
                <span className="text-xs text-[#a78c70] line-through">
                  {currency}
                  {oldPrice}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mb-6 min-h-[3rem] line-clamp-2 text-sm leading-6 text-[#7b6a56]">
          {product.description || "Gram Ansh pantry essential with a clean, reliable finish for daily cooking."}
        </p>

        <div className="mt-auto">
          <Link
            href={productHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2b5a23_0%,#4b742f_100%)] py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_12px_28px_rgba(43,90,35,0.24)] transition hover:brightness-105 active:scale-[0.98]"
          >
            View Product
            <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
          </Link>
        </div>
      </div>
    </article>
  );
}
