/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";
import ResilientProductImage from "@/app/components/ResilientProductImage";
import { getProductImageSources, type Product } from '@/app/data/products';
import { flyImageToCart } from "@/app/lib/flyToCart";

type ProductHeaderProps = {
  product?: Product | null;
  onStickyInfoChange?: (info: FloatingPurchaseInfo) => void;
  addToCartButtonRef?: React.Ref<HTMLButtonElement>;
  buyNowButtonRef?: React.Ref<HTMLButtonElement>;
};

export type FloatingPurchaseInfo = {
  name: string;
  image: string;
  price: number;
  originalPrice?: number | null;
  currencySymbol: string;
  qty: number;
  isOutOfStock: boolean;
  inCart: boolean;
};

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as React.MutableRefObject<T | null>).current = value;
}

export default function ProductHeader({
  product,
  onStickyInfoChange,
  addToCartButtonRef,
  buyNowButtonRef,
}: ProductHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggle, isInWishlist } = useWishlist();
  const { settings } = useSiteSettings();
  const currencySymbol = settings.currencySymbol || "₹";

  const firstSize = product?.sizes && product.sizes.length > 0 ? product.sizes[0] : '';
  const [selectedSize, setSelectedSize] = useState<string>(firstSize);
  const productId = product?.id ?? 0;

  const { addItem, isVariantInCart } = useCart();
  const inCart = isVariantInCart(productId, selectedSize, "");
  const inWishlist = isInWishlist(productId);

  const selectedVariant = useMemo(() => {
    if (!product) return undefined;
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const normalizedSize = selectedSize.trim().toLowerCase();
      return product.variants.find((v) => String(v.label || '').trim().toLowerCase() === normalizedSize) ?? product.variants[0];
    }
    return undefined;
  }, [product, selectedSize]);

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const displayOriginal = selectedVariant?.originalPrice ?? product?.originalPrice;

  // Base image logic remains, but now we ensure we have a robust gallery
  const initialImage = selectedVariant?.image
    ?? (product?.images && product.images.length > 0 ? product.images[0] : product?.image)
    ?? '';

  const descriptionHtml = product?.descriptionHtml?.trim() || '';
  const descriptionText = product?.description?.trim() || 'Savor the authentic taste of tradition. Handcrafted with care using only the finest natural ingredients.';

  // Gallery logic: show all distinct images we have (variant + product).
  const galleryImages = useMemo(() => {
    const imagesSource = [
      selectedVariant?.image,
      ...((selectedVariant as { images?: string[] } | undefined)?.images || []),
      ...(product?.images || []),
      product?.image,
    ]
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);

    const uniq: string[] = [];
    for (const url of imagesSource) {
      if (!uniq.includes(url)) uniq.push(url);
    }

    return uniq;
  }, [product?.image, product?.images, selectedVariant]);

  // Calculate available stock for selected variant/size
  const availableStock = useMemo(() => {
    if (!product) return 0;
    // Check variant stock first
    if (selectedVariant?.stock !== undefined) {
      return selectedVariant.stock;
    }
    // Check stockByVariant
    if (product.stockByVariant && selectedSize) {
      return product.stockByVariant[selectedSize] ?? 0;
    }
    // Check stockBySize
    if (product.stockBySize && selectedSize) {
      return product.stockBySize[selectedSize] ?? 0;
    }
    return Math.max(0, Number(product.quantity || 0));
  }, [product, selectedVariant, selectedSize]);
  const isOutOfStock = availableStock <= 0;

  const [qty, setQty] = useState<number>(1);
  const [shareStatus, setShareStatus] = useState('');

  useEffect(() => {
    if (!product) return;
    const requestedVariant = String(searchParams.get('variant') || '').trim().toLowerCase();
    const requested = product.variants?.find(
      (variant) => String(variant.label || '').trim().toLowerCase() === requestedVariant
    );
    const firstInStock = product.variants?.find((variant) => Number(variant.stock || 0) > 0);
    const nextSize = requested?.label || firstInStock?.label || product.sizes?.[0] || '';
    setSelectedSize(nextSize);
  }, [product, searchParams]);

  useEffect(() => {
    setQty((current) => Math.max(1, Math.min(current, availableStock > 0 ? availableStock : 1)));
  }, [availableStock, selectedSize]);

  // Set the first image from our robust gallery as active initially
  const [activeImage, setActiveImage] = useState<string>(galleryImages[0] || initialImage);
  const [resolvedMainImage, setResolvedMainImage] = useState<string>(galleryImages[0] || initialImage);
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null);
  const mainImageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveImage(galleryImages[0] || initialImage || "");
    if (mobileCarouselRef.current) mobileCarouselRef.current.scrollLeft = 0;
  }, [productId, selectedSize, galleryImages, initialImage]);

  useEffect(() => {
    setResolvedMainImage(activeImage || initialImage);
  }, [activeImage, initialImage]);

  const activeImageSources = useMemo(
    () => Array.from(new Set([
      activeImage,
      ...getProductImageSources(product, selectedSize),
    ].map((source) => String(source || '').trim()).filter(Boolean))),
    [activeImage, product, selectedSize]
  );

  useEffect(() => {
    if (!onStickyInfoChange) return;
    onStickyInfoChange({
      name: product?.name ?? "Product",
      image: (resolvedMainImage || activeImage || initialImage || "").trim(),
      price: Number(displayPrice || 0),
      originalPrice: typeof displayOriginal === "number" ? displayOriginal : null,
      currencySymbol,
      qty,
      isOutOfStock,
      inCart,
    });
  }, [
    onStickyInfoChange,
    product?.name,
    resolvedMainImage,
    activeImage,
    initialImage,
    displayPrice,
    displayOriginal,
    currencySymbol,
    qty,
    isOutOfStock,
    inCart,
  ]);

  const handleShare = async () => {
    if (!product) return;
    const productUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name || 'Product',
          text: `Check out this product: ${product.name || 'Awesome item'}`,
          url: productUrl,
        });
        setShareStatus('Product shared successfully');
      } else {
        await navigator.clipboard.writeText(productUrl);
        setShareStatus('Product link copied');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      try {
        await navigator.clipboard.writeText(productUrl);
        setShareStatus('Product link copied');
      } catch {
        setShareStatus('Unable to share this product');
      }
    }

    window.setTimeout(() => setShareStatus(''), 2500);
  };

  const handleAddToCart = (event?: React.MouseEvent) => {
    if (!product || productId <= 0) return;
    if (isOutOfStock) return;
    if (inCart) {
      router.push("/cart");
      return;
    }

    try {
      const fromRect =
        mainImageContainerRef.current?.getBoundingClientRect() ||
        mobileCarouselRef.current?.getBoundingClientRect() ||
        (event?.currentTarget as HTMLElement | null)?.getBoundingClientRect() ||
        null;

      const renderedImage = mainImageContainerRef.current?.querySelector("img") as HTMLImageElement | null;
      const imageUrl = String(
        renderedImage?.currentSrc ||
        renderedImage?.src ||
        resolvedMainImage ||
        activeImage ||
        initialImage ||
        ""
      ).trim();
      if (fromRect && imageUrl) {
        flyImageToCart({
          imageUrl,
          fromRect,
        });
      }
    } catch {
      // ignore animation failures
    }

    addItem({
      id: productId,
      name: product?.name ?? 'Product',
      price: displayPrice,
      color: "",
      size: selectedSize,
      image: resolvedMainImage || selectedVariant?.image || activeImage || initialImage,
      collection: product?.collection ?? 'SHOP',
      qty,
    });
  };

  const handleWishlist = () => {
    if (!product || productId <= 0) return;
    toggle({
      id: productId,
      name: product?.name ?? 'Product',
      price: displayPrice,
      image: resolvedMainImage || initialImage,
      collection: product?.collection ?? 'SHOP',
    });
  };

  const handleBuyNow = () => {
    if (!product || productId <= 0) return;
    if (isOutOfStock) return;

    // Save Buy Now item to localStorage (doesn't affect cart)
    const buyNowItem = {
      id: productId,
      name: product?.name ?? 'Product',
      price: displayPrice,
      color: "",
      size: selectedSize,
      image: resolvedMainImage || selectedVariant?.image || activeImage || initialImage,
      collection: product?.collection ?? 'SHOP',
      qty: qty,
    };

    localStorage.setItem('sr_buy_now_item', JSON.stringify(buyNowItem));

    // Navigate to checkout
    router.push("/checkout?buyNow=true");
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-4 px-4 lg:grid-cols-12 lg:gap-12 md:px-0">

      {/* --- Main Section: Horizontal Scrollable Images (Desktop & Mobile) --- */}
      <div className="order-1 w-full self-start lg:col-span-7 lg:sticky lg:top-24">
        {/* Mobile: horizontal scrollable carousel */}
        {/* Mobile: horizontal scrollable carousel */}
        <div className="relative overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-white shadow-[0_18px_50px_rgba(35,74,34,0.08)] lg:hidden">
          <div
            ref={mobileCarouselRef}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar touch-pan-x"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
            onScroll={(e) => {
              const el = e.currentTarget;

              if ((el as typeof el & { scrollTimeout?: NodeJS.Timeout }).scrollTimeout) {
                clearTimeout((el as typeof el & { scrollTimeout?: NodeJS.Timeout }).scrollTimeout);
              }

              (el as typeof el & { scrollTimeout?: NodeJS.Timeout }).scrollTimeout =
                setTimeout(() => {
                  const width = el.clientWidth;
                  const index = Math.round(el.scrollLeft / width);

                  const nextImage = galleryImages[index];

                  if (nextImage && nextImage !== activeImage) {
                    setActiveImage(nextImage);
                  }

                  // FORCE exact single-image snap
                  el.scrollTo({
                    left: index * width,
                    behavior: "smooth",
                  });
                }, 80);
            }}
          >
            {(galleryImages.length ? galleryImages : [initialImage])
              .filter(Boolean)
              .map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="relative w-full flex-none aspect-square snap-center snap-always"
                >
                  <ResilientProductImage
                    alt={product?.name ?? "Product Image"}
                    sources={[src, ...galleryImages.filter((image) => image !== src)]}
                    eager={idx === 0}
                  className="pointer-events-none h-full w-full select-none object-contain bg-[radial-gradient(circle_at_top,#fffdf7,transparent_50%),linear-gradient(180deg,#fffef9,#f5efe2)] p-4"
                />
                </div>
              ))}
          </div>

          {/* Floating Badge */}
          <motion.div
            animate={{ rotate: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute top-4 right-4 w-20 h-20 rounded-full bg-secondary/90 backdrop-blur-md text-on-secondary flex flex-col items-center justify-center text-center p-3 shadow-xl z-10 border border-white/20 pointer-events-none"
          >
            <span className="font-label text-[8px] uppercase tracking-widest opacity-80">
              Pure
            </span>

            <span className="font-headline font-black text-lg leading-none my-0.5">
              100%
            </span>

            <span className="font-headline italic text-[10px]">
              Natural
            </span>
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-[1]" />
        </div>

        {/* Desktop: flipkart-style vertical thumbnails + single preview */}
        <div className="hidden lg:grid lg:grid-cols-[108px_minmax(0,1fr)] lg:gap-5">
          {galleryImages.length > 0 ? (
            <div className="hide-scrollbar flex max-h-[640px] flex-col gap-3 overflow-y-auto pr-1">
              {galleryImages.map((src, index) => {
                const isActive = src === activeImage;
                return (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(src)}
                    className={`relative overflow-hidden rounded-[1.2rem] border bg-white transition-all duration-300 ${
                      isActive
                        ? "border-primary shadow-[0_14px_28px_rgba(35,74,34,0.16)] ring-2 ring-primary/20"
                        : "border-outline-variant/15 hover:border-primary/35"
                    }`}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <div className="aspect-square">
                      <ResilientProductImage
                        alt={`${product?.name ?? "Product"} thumbnail ${index + 1}`}
                        sources={[src]}
                        compact
                        className="h-full w-full object-contain bg-[linear-gradient(180deg,#fffef9,#f6efe3)] p-2"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div
            ref={mainImageContainerRef}
            className="relative overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-white shadow-[0_24px_60px_rgba(35,74,34,0.1)]"
          >
            <div className="aspect-square">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="absolute inset-0 z-0"
                >
                  {activeImage ? (
                    <ResilientProductImage
                      alt={product?.name ?? "Product Image"}
                      sources={activeImageSources}
                      eager
                      onSourceResolved={setResolvedMainImage}
                      className="h-full w-full object-contain bg-[radial-gradient(circle_at_top,#fffdf7,transparent_46%),linear-gradient(180deg,#fffef9,#f5efe2)] p-10"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-on-surface-variant/50">
                      No Image
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute right-4 top-4 z-10 flex h-28 w-28 flex-col items-center justify-center rounded-full border border-white/20 bg-secondary/90 p-3 text-center text-on-secondary shadow-xl backdrop-blur-md"
            >
              <span className="font-label text-[10px] uppercase tracking-widest opacity-80">Pure</span>
              <span className="my-0.5 font-headline text-2xl font-black leading-none">100%</span>
              <span className="font-headline text-xs italic">Natural</span>
            </motion.div>
          </div>
        </div>

        {/* --- Lower Section: Thumbnails/Scroll Progress (Desktop & Mobile) --- */}
        {galleryImages.length > 0 && (
          <div className="mt-6 w-full">

            <div className="hidden lg:block" />

            {/* Mobile View: Horizontal Scrollable List (Implicit by main section, 
                but standard practice is often to repeat thumbnails here too 
                if main isn't *literally* scrollable. The requirement says
                "mobile view mein sirf horizontal scrollable hi rakho", meaning the 
                MAIN large images scroll. Since I implemented a cross-fade 
                gallery above, I will add the mobile *scroll* interaction on the
                thumbnails below, which is the standard interpretation of this 
                request combined with animations. The main section above handles 
                the display.) */}
            <div className="lg:hidden w-full overflow-x-auto pb-3 -mb-3 hide-scrollbar">
              {/* Scroll Progress Bar (Required for Mobile) */}
              <div className="px-1 w-full flex justify-start">
                <div className="w-full h-1 bg-outline-variant/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: galleryImages.length > 0
                        ? `${((galleryImages.findIndex(img => img === activeImage) + 1) / galleryImages.length) * 100}%`
                        : '0%'
                    }}
                    layoutId="mobileScrollProgress"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Perks */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: 'eco', text: 'Pure' },
            { icon: 'block', text: 'Non Returnable' },
            { icon: 'local_shipping', text: 'Fast Del.' }
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center rounded-2xl border border-outline-variant/10 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="material-symbols-outlined text-secondary mb-1 text-xl">{item.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-tighter text-on-surface-variant">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product Details Section (Kept mostly the same, minor layout tweaks for padding) */}
      <div className="order-2 flex w-full flex-col gap-5 self-start px-2 lg:col-span-5 lg:sticky lg:top-24 lg:h-fit lg:gap-4 lg:px-0">
        <div className="rounded-[2rem] border border-outline-variant/12 bg-white/90 p-4 shadow-[0_18px_40px_rgba(35,74,34,0.06)] backdrop-blur-sm sm:p-6">
          <div className="space-y-5">
            <nav className="flex items-center gap-3 text-[10px] font-label text-on-surface-variant uppercase tracking-[0.2em]">
              <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => router.push('/shop')}>Collection</span>
              <span className="opacity-30">/</span>
              <span className="text-secondary font-black">{product?.collection || "Essentials"}</span>
            </nav>

            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="min-w-0 font-headline text-3xl font-bold leading-[1.05] tracking-[-0.05em] text-primary break-words whitespace-normal md:text-4xl lg:text-5xl">
                {product?.name ?? 'Premium Product'}
              </h1>
            </div>

            {shareStatus ? (
              <p className="text-xs font-medium text-primary/80">{shareStatus}</p>
            ) : null}

            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-row items-end gap-4">
                <span className="font-headline text-3xl font-bold text-secondary md:text-4xl">
                  {currencySymbol}{Number(displayPrice || 0).toFixed(2)}
                </span>
                {displayOriginal && (
                  <span className="text-sm font-body text-on-surface-variant/50 line-through">
                    {currencySymbol}{Number(displayOriginal || 0).toFixed(2)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex right-2 items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-low p-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                aria-label="Share this product"
              >
                <span className="material-symbols-outlined">share</span>
                {/* <span className="hidden sm:inline">Share</span> */}
              </button>
            </div>
          </div>

          <div className="space-y-7">
            {descriptionHtml ? (
              <div
                className="product-description text-sm leading-7 text-on-surface-variant/80 space-y-4 font-body md:text-base [&_p]:m-0 [&_h1]:mt-0 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:text-primary [&_h2]:mt-0 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h1]:text-primary [&_h3]:mt-0 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-primary [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:pl-1 [&_br]:block [&_br]:h-3"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="text-sm leading-7 text-on-surface-variant/80 font-body whitespace-pre-wrap md:text-base">
                {descriptionText}
              </p>
            )}

            <div className="space-y-3">
              <span className="py-1 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Available Options</span>
              <div className="flex gap-3 flex-wrap">
                {(product?.sizes && product.sizes.length > 0 ? product.sizes : ['Standard']).map((s) => {
                  const optionVariant = product?.variants?.find(
                    (variant) => String(variant.label || '').trim().toLowerCase() === String(s).trim().toLowerCase()
                  );
                  const optionStock = optionVariant ? Number(optionVariant.stock || 0) : Number(product?.quantity || 0);
                  const optionOutOfStock = optionStock <= 0;
                  return (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    disabled={optionOutOfStock}
                    className={`relative px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border disabled:cursor-not-allowed ${s === selectedSize
                      ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-105'
                      : optionOutOfStock
                        ? 'bg-surface-variant/20 text-on-surface-variant/35 border-outline-variant/20 line-through'
                        : 'bg-transparent text-on-surface-variant hover:border-primary border-outline-variant/40'
                      }`}
                  >
                    {s}
                    {optionOutOfStock ? <span className="ml-2 text-[8px] no-underline">Sold out</span> : null}
                  </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sticky-ready Actions */}
          <div className="space-y-4 border-t border-outline-variant/20 pt-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              {/* Qty */}
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-2 py-2 border border-outline-variant/20">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="px-4 font-headline font-bold text-xl">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(availableStock > 0 ? availableStock : 999, q + 1))}
                  disabled={isOutOfStock || (availableStock > 0 && qty >= availableStock)}
                  className="w-10 h-10 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product || productId <= 0 || isOutOfStock}
                ref={(el) => assignRef(addToCartButtonRef, el)}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${inCart
                  ? 'bg-white border border-secondary text-secondary shadow-secondary/20'
                  : 'bg-secondary text-on-secondary shadow-secondary/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {inCart ? "done_all" : "shopping_cart"}
                </span>
                {inCart ? "Go to Cart" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>

            {/* Buy Now Button */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product || productId <= 0 || isOutOfStock}
              ref={(el) => assignRef(buyNowButtonRef, el)}
              className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl bg-primary text-on-primary shadow-primary/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-xl">bolt</span>
              {isOutOfStock ? "Out of Stock" : "Buy Now"}
            </button>

            <button
              type="button"
              onClick={handleWishlist}
              disabled={!product || productId <= 0}
              className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-secondary transition-colors"
            >
              <span className={`material-symbols-outlined text-lg ${inWishlist ? 'icon-filled text-secondary' : ''}`}>
                favorite
              </span>
              {inWishlist ? 'Remove from Wishlist' : 'Save for later'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
