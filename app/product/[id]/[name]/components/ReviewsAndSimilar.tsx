"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";
import ResilientProductImage from "@/app/components/ResilientProductImage";
import ReviewFormModal from "./review/ReviewFormModal";
import { fetchBackendProducts } from "@/app/lib/backendProducts";
import { fetchProductReviews, submitProductReview } from "@/app/lib/apiClient";
import { createProductHref, getProductImageSources } from "@/app/data/products";
import { resolveListingVariant } from "@/app/lib/shopListing";
import type { ReviewFormState } from "./types";
import type { Product } from "@/app/data/products";
import { flyImageToCart } from "@/app/lib/flyToCart";

type DynamicReview = {
  id: string;
  author: string;
  date: string;
  content: string;
  rating: number;
};

const formatDateLabel = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ReviewsAndSimilar({ product }: { product?: Product | null }) {
  const { addItem, isVariantInCart } = useCart();
  const { settings } = useSiteSettings();
  const currencySymbol = settings.currencySymbol || "₹";
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    rating: 5,
    author: "",
    text: "",
    images: []
  });
  const [reviews, setReviews] = useState<DynamicReview[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const productId = Number(product?.id || 0);
  const productPublicId = String(product?.publicId || "").trim();

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const rows = await fetchProductReviews(productId);
      const mapped = (Array.isArray(rows) ? rows : []).map((row) => {
        const item = row as Record<string, unknown>;
        return {
          id: String(item.id || ""),
          author: String(item.user_name || "Anonymous"),
          date: formatDateLabel(String(item.createdAt || "")),
          content: String(item.review_text || ""),
          rating: Number(item.review_rate || 0),
        } as DynamicReview;
      });
      setReviews(mapped);
    } catch {
      setReviews([]);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const loadSimilar = async () => {
      try {
        const all = await fetchBackendProducts();
        const normalizedCurrentCollection = String(product?.collection || "").trim().toLowerCase();

        const basePool = all.filter((p) => {
          if (!p || !p.id) return false;
          if (productId > 0 && p.id === productId) return false;
          if (productPublicId && p.publicId === productPublicId) return false;
          const hasStock = Number(p.quantity || 0) > 0;
          const variantStock = Object.values(p.stockByVariant || {}).some((qty) => Number(qty || 0) > 0);
          if (!hasStock && !variantStock) return false;
          return true;
        });

        const sameCollection = normalizedCurrentCollection
          ? basePool.filter(
            (p) =>
              String(p.collection || "")
                .trim()
                .toLowerCase() === normalizedCurrentCollection
          )
          : [];

        const selected = (sameCollection.length ? sameCollection : basePool).slice(0, 8);
        setSimilarProducts(selected);
      } catch {
        setSimilarProducts([]);
      }
    };
    loadSimilar();
  }, [product?.collection, productId, productPublicId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const handleSubmitReview = async () => {
    if (!productId) return;
    try {
      setIsSubmitting(true);
      await submitProductReview({
        productId,
        rating: reviewForm.rating,
        text: reviewForm.text,
        title: "",
        userName: reviewForm.author,
      });
      setShowReviewModal(false);
      setReviewForm({ rating: 5, author: "", text: "", images: [] });
      await loadReviews();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = (item: Product, event?: React.MouseEvent) => {
    const variant = resolveListingVariant(item, []);
    if (variant.stock <= 0) return;

    try {
      const card = (event?.currentTarget as HTMLElement | null)?.closest?.("[data-product-card]") as HTMLElement | null;
      const img = card?.querySelector?.("img") as HTMLImageElement | null;
      const fromRect = img?.getBoundingClientRect?.() ?? (event?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect?.();
      const imageUrl = String(img?.currentSrc || img?.src || variant.image || item.image || "").trim();
      if (fromRect && imageUrl) {
        flyImageToCart({ imageUrl, fromRect, durationMs: 950 });
      }
    } catch {
      // ignore
    }

    addItem({
      id: item.id,
      name: item.name,
      price: variant.price,
      color: "",
      size: variant.label,
      image: variant.image || item.image || "",
      collection: item.collection || "SIMILAR COLLECTIONS",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: i + 1 <= rating ? "'FILL' 1" : "'FILL' 0" }}>
        {i + 0.5 === rating ? 'star_half' : 'star'}
      </span>
    ));
  };

  return (
    <div>
      <ReviewFormModal
        show={showReviewModal}
        isSubmittingReview={isSubmitting}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
      />
      {/* Customer Reviews */}
      <section className="mt-12 px-4 md:px-0 lg:mt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div className="space-y-3">
            <h3 className="font-headline text-3xl md:text-4xl font-extrabold text-primary tracking-tight">Customer Stories</h3>
            <div className="flex items-center gap-3">
              <div className="flex text-secondary text-lg">{renderStars(Math.round(averageRating || 0))}</div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-on-surface text-lg md:text-xl">{(averageRating || 0).toFixed(1)} / 5.0</span>
                <span className="text-on-surface-variant text-sm font-medium">({reviews.length} Reviews)</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full md:w-auto px-8 py-3.5 bg-secondary text-on-secondary rounded-full font-semibold text-sm uppercase tracking-wide hover:opacity-90 hover:shadow-lg transition-all shadow-md active:scale-95 flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">edit_square</span>
            Write a Review
          </button>
        </div>

        <div
          className="flex gap-4 md:gap-8 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-surface-container-low p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-[85vw] sm:w-[320px] md:w-[400px] snap-center md:snap-start flex-shrink-0 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex text-secondary text-base">{renderStars(review.rating)}</div>
                  <span className="material-symbols-outlined text-outline-variant/20 text-4xl leading-none group-hover:text-secondary/20 transition-colors">format_quote</span>
                </div>

                <p className="font-headline text-on-surface text-base md:text-lg leading-relaxed line-clamp-4 md:line-clamp-5">
                  {review.content}
                </p>
              </div>

              <div className="flex items-center gap-4 pt-6 mt-auto border-t border-outline-variant/10">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden shadow-sm flex items-center justify-center border border-outline-variant/20">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
                </div>
                <div>
                  <div className="font-bold text-on-surface text-sm md:text-base">{review.author}</div>
                  <div className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium mt-0.5">{review.date}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Fallback state when there are no reviews - Fully Responsive */}
          {reviews.length === 0 && (
            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 w-[85vw] md:w-[700px] snap-start flex-shrink-0 flex flex-col items-center justify-center min-h-[250px] text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant/30 mb-3">rate_review</span>
              <p className="text-on-surface-variant font-medium">No reviews yet for this product.</p>
            </div>
          )}
        </div>
      </section>

      {/* Frequently Bought Together / Cross-Sell (SLEEK & MODERN UI) */}
      <section className="border-t border-outline-variant/30 px-3 pb-12 pt-12 lg:pt-16">
        <div className="flex items-center justify-between mb-10">
          <h3 className="font-headline text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
            {product?.collection ? `${product.collection} — Similar Collections` : 'Similar Collections'}
          </h3>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {similarProducts.map((item) => {
            const variant = resolveListingVariant(item, []);
            const isAdded = isVariantInCart(item.id, variant.label, "");
            const inStock = variant.stock > 0;
            const productHref = createProductHref(item, variant.label);
            const imageSources = getProductImageSources(item, variant.label);
            
            return (
              <div key={item.id} data-product-card className="group flex w-[75vw] max-w-[280px] flex-shrink-0 flex-col snap-start sm:w-[250px] md:w-[240px] lg:w-[260px]">
                {/* Image Card Container */}
                <Link href={productHref} className="block relative">
                  <div className="relative mb-5 aspect-[4/5] w-full overflow-hidden rounded-3xl border border-outline-variant/10 bg-[radial-gradient(circle_at_top,#fffdf7,transparent_45%),linear-gradient(180deg,#fffef9,#f5efe2)] shadow-sm transition-all duration-500 group-hover:shadow-xl">
                    {/* Subtle overlay on hover */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                    
                    {imageSources.length ? (
                      <ResilientProductImage
                        sources={imageSources}
                        alt={item.name}
                        className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40 bg-surface-container">
                        <span className="material-symbols-outlined text-5xl">image</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex flex-col flex-grow px-1">
                  <Link href={productHref} className="mb-1 line-clamp-2 font-headline text-lg font-bold text-primary transition-colors group-hover:text-secondary">
                    {item.name}
                  </Link>
                  <p className="line-clamp-2 min-h-[2.8rem] text-sm leading-5 text-on-surface-variant/80">
                    {item.description || "Gram Ansh pantry essential with clean flavor and daily kitchen value."}
                  </p>
                  
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-headline text-[1.15rem] font-extrabold text-secondary tracking-tight">
                      {currencySymbol}{variant.price.toFixed(2)}
                    </span>
                    {!!variant.originalPrice && variant.originalPrice > variant.price && (
                      <span className="font-body text-xs text-on-surface-variant/70 line-through font-medium">
                        {currencySymbol}{Number(variant.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Action Button */}
                  <div className="mt-5">
                    {isAdded ? (
                      <Link
                        href="/cart"
                        className="w-full py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 bg-primary text-on-primary shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                        Go to Cart
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(item, e)}
                        disabled={!inStock}
                        className="group/btn w-full py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 border-[1.5px] border-primary text-primary flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover/btn:-rotate-12 group-hover/btn:scale-110">
                          {inStock ? "add_shopping_cart" : "block"}
                        </span>
                        {inStock ? "Add to Cart" : "Out of Stock"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Fallback when no similar products */}
          {similarProducts.length === 0 && (
            <div className="w-full text-center py-10">
              <p className="text-on-surface-variant font-medium">No similar products available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
