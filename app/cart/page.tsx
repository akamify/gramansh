"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";
import {
  fetchBackendProductById,
  fetchBackendProducts,
  matchVariantByCartSize,
} from "@/app/lib/backendProducts";
import { createProductHref, getProductImageSources, type Product } from "@/app/data/products";
import ConfirmModal from "@/app/components/ConfirmModal";

const SHIPPING = 0;
const CART_IMAGE_FALLBACK = "/placeholder-product.png";

type CartItemBase = {
  id: number;
  name: string;
  price: number;
  qty: number;
  size: string;
  color: string;
  image?: string;
  collection?: string;
};

function useAnimatedNumber(value: number, durationMs = 280) {
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    if (displayValue === value) return;

    const startValue = displayValue;
    const startTime = performance.now();
    let frameId = 0;

    const update = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (value - startValue) * eased;
      setDisplayValue(progress >= 1 ? value : nextValue);
      if (progress < 1) frameId = window.requestAnimationFrame(update);
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [value, durationMs, displayValue]);

  return displayValue;
}

function getDiscountPercent(originalPrice: number | undefined, price: number) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.max(1, Math.round(((originalPrice - price) / originalPrice) * 100));
}

function normalizeImageSources(
  sources: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();

  return sources
    .map((source) => String(source || "").trim())
    .filter(Boolean)
    .filter((source) => {
      if (seen.has(source)) return false;
      seen.add(source);
      return true;
    });
}

function CartItemImage({
  sources,
  fallbackSources,
  alt,
  isOutOfStock,
  priority = false,
}: {
  sources: string[];
  fallbackSources: string[];
  alt: string;
  isOutOfStock: boolean;
  priority?: boolean;
}) {
  const normalizedSources = React.useMemo(
    () => normalizeImageSources(sources),
    [sources],
  );

  const normalizedFallbackSources = React.useMemo(
    () => normalizeImageSources([...fallbackSources, CART_IMAGE_FALLBACK]),
    [fallbackSources],
  );

  const sourceKey = React.useMemo(
    () => normalizedSources.join("|"),
    [normalizedSources],
  );

  const fallbackKey = React.useMemo(
    () => normalizedFallbackSources.join("|"),
    [normalizedFallbackSources],
  );

  const [sourceIndex, setSourceIndex] = React.useState(0);
  const [fallbackIndex, setFallbackIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [showFallback, setShowFallback] = React.useState(false);

  React.useEffect(() => {
    setSourceIndex(0);
    setFallbackIndex(0);
    setLoaded(false);
    setShowFallback(false);
  }, [sourceKey, fallbackKey]);

  React.useEffect(() => {
    if (normalizedSources.length > 0) return;

    const fallbackDelay = window.setTimeout(() => {
      setShowFallback(true);
    }, 350);

    return () => {
      window.clearTimeout(fallbackDelay);
    };
  }, [normalizedSources.length, sourceKey]);

  React.useEffect(() => {
    if (showFallback || normalizedSources.length === 0 || loaded) return;

    const slowLoadTimer = window.setTimeout(() => {
      if (sourceIndex < normalizedSources.length - 1) {
        setSourceIndex((current) => current + 1);
        setLoaded(false);
      } else {
        setShowFallback(true);
        setLoaded(false);
      }
    }, 1800);

    return () => {
      window.clearTimeout(slowLoadTimer);
    };
  }, [
    loaded,
    normalizedSources.length,
    showFallback,
    sourceIndex,
    sourceKey,
  ]);

  const activeSource = showFallback
    ? normalizedFallbackSources[fallbackIndex] || CART_IMAGE_FALLBACK
    : normalizedSources[sourceIndex] || "";

  const showSkeleton = !loaded && !showFallback;

  return (
    <>
      {showSkeleton ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-variant/30 via-white to-surface-variant/40" />
      ) : null}

      {activeSource ? (
        <img
          key={`${showFallback ? "fallback" : "source"}-${activeSource}`}
          src={activeSource}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`h-full w-full object-cover transition-all duration-500 ${
            loaded || showFallback ? "opacity-100" : "opacity-0"
          } ${
            isOutOfStock
              ? "grayscale opacity-55"
              : "group-hover:scale-105"
          }`}
          onLoad={() => {
            setLoaded(true);
          }}
          onError={() => {
            setLoaded(false);

            if (!showFallback) {
              if (sourceIndex < normalizedSources.length - 1) {
                setSourceIndex((current) => current + 1);
              } else {
                setShowFallback(true);
                setFallbackIndex(0);
              }

              return;
            }

            if (fallbackIndex < normalizedFallbackSources.length - 1) {
              setFallbackIndex((current) => current + 1);
            }
          }}
        />
      ) : null}
    </>
  );
}

function CartSkeletonCard() {
  return (
    <div className="rounded-[0.5rem] border border-outline-variant/30 bg-white p-3 sm:p-6">
      <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6">
        <div className="h-32 animate-pulse rounded-[0.5rem] bg-surface-variant/30 sm:h-44" />

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded-full bg-surface-variant/30" />
              <div className="grid max-w-[220px] grid-cols-2 gap-2">
                <div className="h-7 animate-pulse rounded-full bg-surface-variant/20" />
                <div className="h-7 animate-pulse rounded-full bg-surface-variant/20" />
              </div>
            </div>

            <div className="h-10 w-10 animate-pulse rounded-full bg-surface-variant/20" />
          </div>

          <div className="flex items-end justify-between gap-4 pt-6">
            <div className="h-11 w-28 animate-pulse rounded-2xl bg-surface-variant/20" />

            <div className="space-y-2">
              <div className="ml-auto h-3 w-16 animate-pulse rounded-full bg-surface-variant/20" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-surface-variant/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartPageSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-[1600px] bg-surface px-4 pt-6 pb-8 sm:px-6 sm:pt-8 lg:px-12 lg:pt-10 xl:px-16">
      <div className="flex flex-col items-start gap-12 lg:grid lg:grid-cols-12">
        <section className="w-full space-y-10 lg:col-span-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-3">
              <div className="h-12 w-52 animate-pulse rounded-full bg-surface-variant/30" />
              <div className="h-5 w-72 animate-pulse rounded-full bg-surface-variant/20" />
            </div>

            <div className="h-5 w-32 animate-pulse rounded-full bg-surface-variant/20" />
          </div>

          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <CartSkeletonCard key={index} />
            ))}
          </div>
        </section>

        <aside className="w-full lg:sticky lg:top-32 lg:col-span-4">
          <div className="rounded-[0.5rem] border border-outline-variant/30 bg-white p-4 shadow-2xl shadow-primary/5 lg:p-8">
            <div className="h-8 w-40 animate-pulse rounded-full bg-surface-variant/30" />

            <div className="mt-8 space-y-5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded-full bg-surface-variant/20" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-surface-variant/20" />
              </div>

              <div className="flex items-center justify-between">
                <div className="h-4 w-28 animate-pulse rounded-full bg-surface-variant/20" />
                <div className="h-6 w-14 animate-pulse rounded-full bg-surface-variant/20" />
              </div>

              <div className="my-2 h-px bg-outline-variant/20" />

              <div className="flex items-end justify-between py-2">
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-surface-variant/20" />
                  <div className="h-4 w-20 animate-pulse rounded-full bg-surface-variant/20" />
                </div>

                <div className="h-10 w-28 animate-pulse rounded-full bg-surface-variant/30" />
              </div>
            </div>

            <div className="mt-10 h-14 animate-pulse rounded-[1.5rem] bg-surface-variant/30" />

            <div className="mt-8 space-y-4">
              <div className="h-4 w-36 animate-pulse rounded-full bg-surface-variant/20" />
              <div className="h-4 w-40 animate-pulse rounded-full bg-surface-variant/20" />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function CartPage() {
  const {
    addItem,
    items,
    removeItem,
    updateQty,
    itemCount,
    isHydrating,
    syncError,
    refreshCart,
  } = useCart();
  const { settings } = useSiteSettings();

  const currencySymbol = settings.currencySymbol || "Rs.";

  const [stockByItem, setStockByItem] = React.useState<Record<string, number>>(
    {},
  );
  const [productHrefByItem, setProductHrefByItem] = React.useState<
    Record<string, string>
  >({});
  const [imageSourcesByItem, setImageSourcesByItem] = React.useState<
    Record<string, string[]>
  >({});
  const [pricingByItem, setPricingByItem] = React.useState<
    Record<string, { price: number; originalPrice?: number }>
  >({});
  const [isStockLoading, setIsStockLoading] = React.useState(false);
  const [stockError, setStockError] = React.useState("");
  const [recommendations, setRecommendations] = React.useState<Product[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = React.useState(false);
  const [pendingRecommendationId, setPendingRecommendationId] = React.useState<number | null>(null);
  const [pendingItemKey, setPendingItemKey] = React.useState("");
  const [removeTarget, setRemoveTarget] = React.useState<{
    id: number;
    size: string;
    color: string;
    name: string;
  } | null>(null);

  const itemIdentityKey = React.useMemo(
    () => items.map((item) => `${item.id}|${item.size}|${item.color}`).join("::"),
    [items],
  );

  const loadStock = React.useCallback(async () => {
    if (!items.length) {
      setStockByItem({});
      setProductHrefByItem({});
      setImageSourcesByItem({});
      setPricingByItem({});
      setStockError("");
      return;
    }

    setIsStockLoading(true);
    setStockError("");

    try {
      const productIds = [
        ...new Set(items.map((item) => item.id).filter((id) => id > 0)),
      ];

      const products = await Promise.all(
        productIds.map((productId) => fetchBackendProductById(productId)),
      );

      const productMap = new Map(
        products
          .filter((product): product is NonNullable<typeof product> =>
            Boolean(product),
          )
          .map((product) => [product.id, product]),
      );

      const nextStock: Record<string, number> = {};
      const nextHrefs: Record<string, string> = {};
      const nextImages: Record<string, string[]> = {};
      const nextPricing: Record<string, { price: number; originalPrice?: number }> = {};

      items.forEach((item) => {
        const key = `${item.id}|${item.size}|${item.color}`;
        const product = productMap.get(item.id);
        const variant = product
          ? matchVariantByCartSize(product, item.size)
          : undefined;

        nextStock[key] = variant
          ? Math.max(0, Number(variant.stock || 0))
          : product
            ? Math.max(0, Number(product.quantity || 0))
            : 0;

        nextHrefs[key] = product
          ? createProductHref(product, variant?.label || item.size)
          : createProductHref({ id: item.id, name: item.name }, item.size);

        nextImages[key] = normalizeImageSources([
          variant?.image,
          ...(variant?.images || []),
          item.image,
          ...(product?.images || []),
          product?.image,
        ]);

        nextPricing[key] = {
          price: typeof variant?.price === "number" && Number.isFinite(variant.price)
            ? variant.price
            : item.price,
          originalPrice:
            typeof variant?.originalPrice === "number" && Number.isFinite(variant.originalPrice)
              ? variant.originalPrice
              : product?.originalPrice,
        };
      });

      setStockByItem(nextStock);
      setProductHrefByItem(nextHrefs);
      setImageSourcesByItem(nextImages);
      setPricingByItem(nextPricing);
    } catch {
      const fallbackImages: Record<string, string[]> = {};
      const fallbackPricing: Record<string, { price: number; originalPrice?: number }> = {};

      items.forEach((item) => {
        const key = `${item.id}|${item.size}|${item.color}`;
        fallbackImages[key] = normalizeImageSources([item.image]);
        fallbackPricing[key] = { price: item.price };
      });

      setImageSourcesByItem(fallbackImages);
      setPricingByItem(fallbackPricing);
      setStockError("Stock status could not be refreshed. Please try again.");
    } finally {
      setIsStockLoading(false);
    }
  }, [items]);

  React.useEffect(() => {
    loadStock();
  }, [itemIdentityKey, loadStock]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!items.length) {
        setRecommendations([]);
        return;
      }

      setRecommendationsLoading(true);
      try {
        const cartProductIds = new Set(items.map((item) => item.id));
        const cartProducts = await Promise.all(
          [...cartProductIds].map((productId) => fetchBackendProductById(productId)),
        );
        const preferredCategories = new Set(
          cartProducts
            .map((product) => String(product?.category || "").trim().toLowerCase())
            .filter(Boolean),
        );

        const allProducts = await fetchBackendProducts();
        if (cancelled) return;

        setRecommendations(() => {
          return allProducts
            .filter((product) => product.quantity > 0 && !cartProductIds.has(product.id))
            .sort((a, b) => {
              const aCategory = preferredCategories.has(String(a.category || "").trim().toLowerCase()) ? 1 : 0;
              const bCategory = preferredCategories.has(String(b.category || "").trim().toLowerCase()) ? 1 : 0;
              if (aCategory !== bCategory) return bCategory - aCategory;
              return b.quantity - a.quantity;
            })
            .slice(0, 8);
        });
      } catch {
        if (!cancelled) setRecommendations([]);
      } finally {
        if (!cancelled) setRecommendationsLoading(false);
      }
    }

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [itemIdentityKey, items]);

  const handleQuantityChange = async (
    item: { id: number; size: string; color: string; qty: number },
    delta: number,
    maxStock: number,
  ) => {
    const key = `${item.id}|${item.size}|${item.color}`;

    if (pendingItemKey === key) return;

    const nextQty = item.qty + delta;

    if (nextQty < 1 || (maxStock > 0 && nextQty > maxStock)) return;

    setPendingItemKey(key);

    try {
      await updateQty(item.id, item.size, delta, item.color);
    } finally {
      setPendingItemKey("");
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;

    const key = `${removeTarget.id}|${removeTarget.size}|${removeTarget.color}`;

    setPendingItemKey(key);

    try {
      const removed = await removeItem(
        removeTarget.id,
        removeTarget.size,
        removeTarget.color,
      );

      if (removed) {
        setRemoveTarget(null);
      }
    } finally {
      setPendingItemKey("");
    }
  };

  const hasOutOfStockItems =
    !isStockLoading &&
    !stockError &&
    items.some((item) => {
      const key = `${item.id}|${item.size}|${item.color}`;
      return (stockByItem[key] ?? 0) <= 0;
    });

  const hasQuantityConflict =
    !isStockLoading &&
    !stockError &&
    items.some((item) => {
      const key = `${item.id}|${item.size}|${item.color}`;
      const available = stockByItem[key] ?? 0;
      return available > 0 && item.qty > available;
    });

  const isCheckoutBlocked =
    isStockLoading ||
    Boolean(stockError) ||
    hasOutOfStockItems ||
    hasQuantityConflict;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + SHIPPING;
  const animatedSubtotal = useAnimatedNumber(subtotal);
  const animatedTotal = useAnimatedNumber(total);
  const animatedItemCount = useAnimatedNumber(itemCount, 220);

  if (isHydrating) {
    return <CartPageSkeleton />;
  }

  if (!itemCount) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-6 pt-8 pb-10">
        <div className="max-w-md animate-fade-in text-center">
          <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl" />
            <span className="material-symbols-outlined relative text-8xl text-primary/20">
              shopping_basket
            </span>
          </div>

          <h1 className="font-headline mb-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            Your cart is empty
          </h1>

          <p className="mb-10 leading-relaxed text-on-surface-variant/70">
            It looks like you haven&apos;t added anything to your cart yet.
            Discover our exclusive collection and find something you love.
          </p>

          <Link
            href="/shop"
            className="inline-flex items-center gap-3 rounded-2xl bg-primary px-10 py-4 font-bold text-white transition-all hover:shadow-2xl hover:shadow-primary/30 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">explore</span>
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] bg-surface px-4 pt-6 pb-10 sm:px-6 sm:pt-8 lg:px-12 lg:pt-10 xl:px-16">
      <section className="mb-6 rounded-[0.75rem] border border-primary/10 bg-gradient-to-r from-primary/[0.04] via-white to-secondary/[0.06] px-4 py-4 shadow-[0_18px_60px_rgba(21,66,18,0.06)] sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary/75">
              <span className="material-symbols-outlined text-sm">shopping_bag</span>
              Cart
            </span>

            <div>
              <h1 className="font-headline text-3xl font-bold tracking-[-0.04em] text-primary sm:text-5xl lg:text-6xl">
                Your Cart
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-on-surface-variant/75 sm:mt-2 sm:text-base">
                Review your items, adjust quantities, and continue to checkout with confidence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="rounded-full border border-primary/10 bg-white/80 px-3 py-1.5 text-xs font-semibold text-on-surface-variant sm:px-4 sm:py-2 sm:text-sm">
              {Math.round(animatedItemCount)} {itemCount === 1 ? "item" : "items"} selected
            </div>
            <Link
              href="/shop"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white transition-all hover:bg-primary-container hover:shadow-lg hover:shadow-primary/20 sm:min-h-11 sm:px-5"
            >
              <span className="material-symbols-outlined text-base">
                add_shopping_cart
              </span>
              Continue shopping
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start">
        <section className="w-full space-y-10 lg:col-span-8">
          {syncError ? (
            <div className="flex flex-col gap-3 rounded-[0.5rem] border border-error/20 bg-error/[0.05] p-4 text-sm text-error sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium">
                {syncError}
              </p>
              <button
                type="button"
                onClick={() => {
                  void refreshCart();
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-error/20 px-4 font-bold text-error transition-colors hover:bg-error/10"
              >
                Retry Sync
              </button>
            </div>
          ) : null}

          <div className="space-y-6">
            {items.map((item: CartItemBase, index) => {
              const key = `${item.id}|${item.size}|${item.color}`;
              const hasStockValue = Object.prototype.hasOwnProperty.call(
                stockByItem,
                key,
              );
              const available = stockByItem[key] ?? 0;
              const stockKnown = !isStockLoading && !stockError && hasStockValue;
              const isOutOfStock = stockKnown && available <= 0;
              const exceedsStock =
                stockKnown && available > 0 && item.qty > available;
              const productHref =
                productHrefByItem[key] ||
                createProductHref({ id: item.id, name: item.name }, item.size);
              const isItemPending = pendingItemKey === key;
              const resolvedImageSources = imageSourcesByItem[key] || [];
              const resolvedPricing = pricingByItem[key];
              const unitPrice =
                resolvedPricing && Number.isFinite(resolvedPricing.price)
                  ? resolvedPricing.price
                  : item.price;
              const originalPrice = resolvedPricing?.originalPrice;
              const discountPercent = getDiscountPercent(originalPrice, unitPrice);
              const lineSubtotal = unitPrice * item.qty;

              const imageContent = (
                <>
                  <CartItemImage
                    sources={resolvedImageSources}
                    fallbackSources={[item.image || ""]}
                    alt={item.name}
                    isOutOfStock={isOutOfStock}
                    priority={index === 0}
                  />

                  {isOutOfStock ? (
                    <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/25">
                      <span className="rounded-full bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-error">
                        Out of Stock
                      </span>
                    </div>
                  ) : null}
                </>
              );

              const removeButton = (
                <button
                  onClick={() =>
                    setRemoveTarget({
                      id: item.id,
                      size: item.size,
                      color: item.color,
                      name: item.name,
                    })
                  }
                  disabled={isItemPending}
                  className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-low text-on-surface-variant/50 transition-all hover:border-error/20 hover:bg-error/10 hover:text-error disabled:opacity-40 sm:min-h-10 sm:min-w-10"
                  aria-label={`Remove ${item.name} from cart`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg leading-none">
                    delete_sweep
                  </span>
                </button>
              );

              const mobileQuantityControl = (
                <div className="flex items-center rounded-full border border-outline-variant/20 bg-surface-container-low px-1 py-1 shadow-sm lg:hidden">
                  <button
                    onClick={() =>
                      handleQuantityChange(item, -1, available)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-all hover:bg-white hover:shadow-sm disabled:opacity-30"
                    disabled={
                      item.qty <= 1 ||
                      isOutOfStock ||
                      isItemPending ||
                      Boolean(stockError)
                    }
                    type="button"
                    aria-label={`Decrease quantity for ${item.name}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      remove
                    </span>
                  </button>

                  <span className="min-w-8 px-1 text-center text-base font-extrabold leading-none text-primary">
                    {item.qty}
                  </span>

                  <button
                    onClick={() =>
                      handleQuantityChange(item, 1, available)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-primary transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={
                      !stockKnown ||
                      isOutOfStock ||
                      isItemPending ||
                      item.qty >= available
                    }
                    type="button"
                    aria-label={`Increase quantity for ${item.name}`}
                    >
                      <span className="material-symbols-outlined text-base">
                        add
                      </span>
                    </button>
                </div>
              );

              const desktopQuantityControl = (
                <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() =>
                        handleQuantityChange(item, -1, available)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low text-primary transition-all hover:bg-white hover:shadow-sm disabled:opacity-30"
                      disabled={
                        item.qty <= 1 ||
                        isOutOfStock ||
                        isItemPending ||
                        Boolean(stockError)
                      }
                      type="button"
                      aria-label={`Decrease quantity for ${item.name}`}
                    >
                      <span className="material-symbols-outlined text-base">
                        remove
                      </span>
                    </button>

                    <span className="min-w-8 text-center text-lg font-extrabold text-primary">
                      {item.qty}
                    </span>

                    <button
                      onClick={() =>
                        handleQuantityChange(item, 1, available)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low text-primary transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                      disabled={
                        !stockKnown ||
                        isOutOfStock ||
                        isItemPending ||
                        item.qty >= available
                      }
                      type="button"
                      aria-label={`Increase quantity for ${item.name}`}
                    >
                      <span className="material-symbols-outlined text-base">
                        add
                      </span>
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="block text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-on-surface-variant/45">
                      Subtotal
                    </span>
                    <span className="font-headline text-[2rem] font-semibold leading-none tracking-[-0.02em] text-primary">
                      {currencySymbol}
                      {lineSubtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    {removeButton}
                  </div>
                </div>
              );

              return (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
                  className={`group relative overflow-hidden rounded-[0.75rem] border bg-white p-3.5 shadow-[0_18px_55px_rgba(21,66,18,0.06)] transition-all duration-500 sm:p-5 lg:p-6 ${
                    isOutOfStock || exceedsStock
                      ? "border-error/30 bg-error/[0.03]"
                      : "border-outline-variant/30 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(21,66,18,0.1)]"
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-secondary/60 to-primary/20" />

                  <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 lg:hidden">
                    {isOutOfStock ? (
                      <div className="relative aspect-square h-[92px] w-[92px] overflow-hidden rounded-2xl bg-surface-container-low">
                        {imageContent}
                      </div>
                    ) : (
                      <Link
                        href={productHref}
                        className="relative block aspect-square h-[92px] w-[92px] overflow-hidden rounded-2xl bg-surface-container-low"
                        aria-label={`Open ${item.name} ${item.size}`}
                      >
                        {imageContent}
                      </Link>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 pr-1">
                          {isOutOfStock ? (
                            <h3 className="font-headline line-clamp-2 text-[1.28rem] font-bold leading-tight tracking-[-0.03em] text-primary/60">
                              {item.name}
                            </h3>
                          ) : (
                            <Link href={productHref} className="block">
                              <h3 className="font-headline line-clamp-2 text-[1.28rem] font-bold leading-tight tracking-[-0.03em] text-primary transition-colors group-hover:text-primary-container">
                                {item.name}
                              </h3>
                            </Link>
                          )}
                        </div>

                        {removeButton}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-primary/10 bg-surface-container-low px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                          Size: {item.size}
                        </span>

                        {item.color ? (
                          <span className="rounded-full border border-primary/10 bg-surface-container-low px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                            {item.color}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-end gap-2">
                            <span className="text-[1.45rem] font-black leading-none text-primary">
                              {currencySymbol}
                              {unitPrice.toLocaleString()}
                            </span>
                            {typeof originalPrice === "number" && originalPrice > unitPrice ? (
                              <>
                                <span className="text-xs font-medium text-on-surface-variant/50 line-through">
                                  {currencySymbol}
                                  {originalPrice.toLocaleString()}
                                </span>
                                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-secondary">
                                  {discountPercent}% off
                                </span>
                              </>
                            ) : null}
                          </div>

                          {(isOutOfStock || exceedsStock) ? (
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-error">
                              {isOutOfStock ? "Currently unavailable" : `Only ${available} left in stock`}
                            </p>
                          ) : null}
                        </div>

                        {mobileQuantityControl}
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:grid lg:grid-cols-[9rem_minmax(0,1fr)_13rem] lg:items-center lg:gap-6">
                    {isOutOfStock ? (
                      <div className="relative aspect-square w-36 overflow-hidden rounded-[0.75rem] bg-surface-container-low">
                        {imageContent}
                      </div>
                    ) : (
                      <Link
                        href={productHref}
                        className="relative block aspect-square w-36 overflow-hidden rounded-[0.75rem] bg-surface-container-low"
                        aria-label={`Open ${item.name} ${item.size}`}
                      >
                        {imageContent}
                      </Link>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {isOutOfStock ? (
                            <h3 className="font-headline mb-2 line-clamp-2 text-[1.9rem] font-bold tracking-[-0.03em] text-primary/60">
                              {item.name}
                            </h3>
                          ) : (
                            <Link href={productHref} className="block">
                              <h3 className="font-headline mb-2 line-clamp-2 text-[1.9rem] font-bold tracking-[-0.03em] text-primary transition-colors group-hover:text-primary-container">
                                {item.name}
                              </h3>
                            </Link>
                          )}

                          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant/70">
                            <span className="rounded-full border border-primary/10 bg-surface-container-low px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                              Size: {item.size}
                            </span>

                            {item.color ? (
                              <span className="rounded-full border border-primary/10 bg-surface-container-low px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                                Color: {item.color}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/55">
                                Unit Price
                              </p>
                              <div className="mt-1 flex flex-wrap items-end gap-2">
                                <span className="text-2xl font-bold text-primary">
                                  {currencySymbol}
                                  {unitPrice.toLocaleString()}
                                </span>
                                {typeof originalPrice === "number" && originalPrice > unitPrice ? (
                                  <>
                                    <span className="text-sm font-medium text-on-surface-variant/50 line-through">
                                      {currencySymbol}
                                      {originalPrice.toLocaleString()}
                                    </span>
                                    <span className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                                      {discountPercent}% off
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            <div className="h-11 w-px bg-outline-variant/30" />

                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/55">
                                Availability
                              </p>
                              <p className={`text-sm font-semibold ${isOutOfStock || exceedsStock ? "text-error" : "text-primary/75"}`}>
                                {isOutOfStock
                                  ? "Unavailable"
                                  : stockKnown
                                    ? `${available} in stock`
                                    : "Checking stock"}
                              </p>
                            </div>
                          </div>

                          {isOutOfStock ? (
                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-error">
                              This item is currently unavailable
                            </p>
                          ) : exceedsStock ? (
                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-error">
                              Only {available} left in stock
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {desktopQuantityControl}
                  </div>
                </div>
              );
            })}
          </div>

          <section className="pt-2">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-headline text-2xl font-bold tracking-[-0.03em] text-primary sm:text-3xl">
                  You May Also Like
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant/70">
                  Handpicked from similar categories in your cart.
                </p>
              </div>
            </div>

            {recommendationsLoading ? (
              <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-[170px] shrink-0 rounded-[0.75rem] border border-outline-variant/20 bg-white p-2.5 shadow-[0_16px_45px_rgba(21,66,18,0.05)] sm:w-auto sm:p-4"
                  >
                    <div className="aspect-square animate-pulse rounded-[0.75rem] bg-surface-variant/30 sm:aspect-[4/3.3]" />
                    <div className="mt-3 h-5 w-3/4 animate-pulse rounded-full bg-surface-variant/30" />
                    <div className="mt-2 h-4 w-1/2 animate-pulse rounded-full bg-surface-variant/20" />
                    <div className="mt-4 h-10 animate-pulse rounded-full bg-surface-variant/20" />
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:snap-none xl:grid-cols-4">
                {recommendations.map((product) => {
                  const variant = product.variants?.[0];
                  const productHref = createProductHref(product, variant?.label);
                  const imageSources = getProductImageSources(product, variant?.label);
                  const displayPrice =
                    typeof variant?.price === "number" && Number.isFinite(variant.price)
                      ? variant.price
                      : product.price;
                  const displayOriginal =
                    typeof variant?.originalPrice === "number" && Number.isFinite(variant.originalPrice)
                      ? variant.originalPrice
                      : product.originalPrice;
                  const isRecommendationPending = pendingRecommendationId === product.id;
                  const discountPercent = getDiscountPercent(displayOriginal, displayPrice);

                  return (
                    <div
                      key={product.id}
                      className="w-[170px] shrink-0 snap-start overflow-hidden rounded-[0.75rem] border border-outline-variant/20 bg-white p-2.5 shadow-[0_16px_45px_rgba(21,66,18,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(21,66,18,0.1)] sm:w-auto sm:p-4"
                    >
                      <Link
                        href={productHref}
                        className="block overflow-hidden rounded-[0.75rem] bg-surface-container-low"
                      >
                        <div className="relative aspect-square sm:aspect-[4/3.3]">
                          <img
                            src={imageSources[0] || product.image || "/placeholder-product.png"}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-contain p-2.5 transition-transform duration-500 hover:scale-105 sm:object-cover sm:p-0"
                          />
                          {discountPercent > 0 ? (
                            <span className="absolute left-2.5 top-2.5 rounded-full bg-secondary px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white sm:left-3 sm:top-3 sm:px-2.5 sm:text-[10px]">
                              {discountPercent}% off
                            </span>
                          ) : null}
                        </div>
                      </Link>

                      <div className="mt-3 sm:mt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/55 sm:text-[11px] sm:tracking-[0.22em]">
                          {product.category || product.collection || "Recommended"}
                        </p>
                        <Link href={productHref} className="mt-1 block">
                          <h3 className="font-headline line-clamp-2 min-h-[2.5rem] text-[1.05rem] font-semibold leading-tight tracking-[-0.02em] text-primary sm:min-h-[3.1rem] sm:text-[1.35rem] sm:font-bold">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="mt-2 flex flex-wrap items-end gap-1.5 sm:gap-2">
                          <span className="text-[1rem] font-bold text-primary sm:text-lg">
                            {currencySymbol}
                            {displayPrice.toLocaleString()}
                          </span>
                          {typeof displayOriginal === "number" && displayOriginal > displayPrice ? (
                            <span className="text-[11px] font-medium text-on-surface-variant/50 line-through sm:text-sm">
                              {currencySymbol}
                              {displayOriginal.toLocaleString()}
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (isRecommendationPending) return;
                            const chosenSize = variant?.label || product.sizes?.[0] || "Default";
                            setPendingRecommendationId(product.id);
                            try {
                              addItem({
                                id: product.id,
                                name: product.name,
                                price: displayPrice,
                                size: chosenSize,
                                color: "",
                                image: imageSources[0] || product.image || "",
                                collection: String(product.collection || product.category || "SHOP").toUpperCase(),
                              });
                              await new Promise((resolve) => window.setTimeout(resolve, 240));
                            } finally {
                              setPendingRecommendationId((current) => current === product.id ? null : current);
                            }
                          }}
                          disabled={isRecommendationPending}
                          className={`mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full px-3 text-[12px] font-semibold transition-all sm:mt-5 sm:min-h-11 sm:px-4 sm:text-sm ${
                            isRecommendationPending
                              ? "cursor-wait bg-primary/85 text-white shadow-lg shadow-primary/15"
                              : "bg-primary text-white hover:bg-primary-container hover:shadow-lg hover:shadow-primary/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {isRecommendationPending ? "progress_activity" : "add_shopping_cart"}
                          </span>
                          {isRecommendationPending ? "Adding..." : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        </section>

        <aside className="w-full lg:sticky lg:top-24 lg:col-span-4">
          <div className="rounded-[0.75rem] border border-outline-variant/30 bg-white p-5 shadow-[0_24px_70px_rgba(21,66,18,0.08)] lg:p-8">
            <div className="mb-8 flex items-center justify-between gap-3">
              <h2 className="font-headline text-3xl font-bold tracking-[-0.03em] text-primary">
              Order Summary
              </h2>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                Secure
              </span>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between text-on-surface-variant/70">
                <span className="text-sm font-medium">Cart Subtotal</span>
                <span className="text-base font-medium text-primary/85">
                  {currencySymbol}
                  {Math.round(animatedSubtotal).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant/70">
                <span className="text-sm font-medium">Delivery Charges</span>
                <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                  Free
                </span>
              </div>

              <div className="my-2 h-px bg-outline-variant/20" />

              <div className="flex items-center justify-between py-2">
                <p className="mb-1 text-[20px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80">
                  Total
                </p>

                <div className="text-right">
                  <p className="font-headline text-[3.25rem] font-semibold leading-none tracking-[-0.03em] text-primary sm:text-[3.5rem]">
                    {currencySymbol}
                    {Math.round(animatedTotal).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href={isCheckoutBlocked ? "#" : "/checkout"}
              onClick={(event) => {
                if (isCheckoutBlocked) event.preventDefault();
              }}
              aria-disabled={isCheckoutBlocked}
              className={`group mt-10 flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-5 text-lg font-bold transition-all ${
                isCheckoutBlocked
                  ? "cursor-not-allowed bg-surface-variant text-on-surface-variant/50"
                  : "bg-primary text-white hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98]"
              }`}
            >
              {isStockLoading
                ? "Checking Stock…"
                : stockError
                  ? "Stock Check Required"
                  : hasOutOfStockItems || hasQuantityConflict
                    ? "Update Cart to Continue"
                    : "Secure Checkout"}

              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>

            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-[0.5rem] bg-surface-container-low px-3 py-3 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-lg text-primary/60">
                  verified
                </span>
                <p className="text-xs font-medium">Authenticity Guaranteed</p>
              </div>

              <div className="flex items-center gap-3 rounded-[0.5rem] bg-surface-container-low px-3 py-3 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-lg text-primary/60">
                  local_shipping
                </span>
                <p className="text-xs font-medium">
                  Safe & Disinfected Delivery
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/20 bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(21,66,18,0.12)] backdrop-blur-xl sm:px-6 lg:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant/55">
              Total
            </p>
            <p className="font-headline truncate text-3xl font-bold tracking-[-0.03em] text-primary">
              {currencySymbol}
              {Math.round(animatedTotal).toLocaleString()}
            </p>
          </div>

          <Link
            href={isCheckoutBlocked ? "#" : "/checkout"}
            onClick={(event) => {
              if (isCheckoutBlocked) event.preventDefault();
            }}
            aria-disabled={isCheckoutBlocked}
            className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-all ${
              isCheckoutBlocked
                ? "cursor-not-allowed bg-surface-variant text-on-surface-variant/50"
                : "bg-primary text-white shadow-lg shadow-primary/20"
            }`}
          >
            <span className="material-symbols-outlined text-base">lock</span>
            Checkout
          </Link>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(removeTarget)}
        title="Remove item from cart?"
        message="Are you sure you want to remove this product from your cart?"
        cancelLabel="Cancel"
        confirmLabel="Remove"
        tone="danger"
        loading={Boolean(
          removeTarget &&
            pendingItemKey ===
              `${removeTarget.id}|${removeTarget.size}|${removeTarget.color}`,
        )}
        onClose={() => {
          if (!pendingItemKey) setRemoveTarget(null);
        }}
        onConfirm={confirmRemove}
      />
    </main>
  );
}
