'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductHeader, { type FloatingPurchaseInfo } from './ProductHeader';
import WellnessPath from './WellnessPath';
import NutritionFacts from './NutritionFacts';
import ReviewsAndSimilar from './ReviewsAndSimilar';
import PromiseBanner from './PromiseBanner';
import { fetchBackendProductById, fetchBackendProducts } from '@/app/lib/backendProducts';
import { formatProductNameForPath, type Product } from '@/app/data/products';
import ProductNotFound from './ProductNotFound';

import { ProductPageSkeleton } from '@/app/components/Skeletons';
import DesktopFloatingPurchaseBar from './DesktopFloatingPurchaseBar';
import { useDesktopFloatingBarVisibility } from './useDesktopFloatingBarVisibility';
import { flyImageToCart } from '@/app/lib/flyToCart';

export default function ProductPageClient({ id, name }: { id: string; name?: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stickyInfo, setStickyInfo] = useState<FloatingPurchaseInfo | null>(null);
  const addToCartRef = useRef<HTMLButtonElement | null>(null);
  const buyNowRef = useRef<HTMLButtonElement | null>(null);
  const floatingSentinelRef = useRef<HTMLDivElement | null>(null);
  const floatingVisible = useDesktopFloatingBarVisibility(floatingSentinelRef);

  const requestedId = useMemo(() => String(id || '').trim(), [id]);
  const requestedSlug = useMemo(() => formatProductNameForPath(name || ''), [name]);
  const floatingImageUrls = useMemo(() => {
    if (!product || !stickyInfo) return [];
    return Array.from(new Set([
      stickyInfo.image,
      ...(product.images || []),
      product.image,
      ...(product.variants || []).flatMap((variant) => [
        ...(variant.images || []),
        variant.image || '',
      ]),
    ].map((value) => String(value || '').trim()).filter(Boolean)));
  }, [product, stickyInfo]);

  useEffect(() => {
    let active = true;

    const resolveProduct = async () => {
      try {
        setIsLoading(true);
        let resolved: Product | null = await fetchBackendProductById(requestedId);

        if (!resolved) {
          const allProducts = await fetchBackendProducts();
          const requestedNumericId = Number(requestedId);
          resolved =
            allProducts.find((p) => p.publicId === requestedId) ||
            allProducts.find((p) => Number.isFinite(requestedNumericId) && p.id === requestedNumericId) ||
            allProducts.find((p) => p.slug === requestedSlug) ||
            null;
        }

        if (active) {
          setProduct(resolved);
        }
      } catch (error) {
        if (active) setProduct(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    resolveProduct();

    return () => {
      active = false;
    };
  }, [requestedId, requestedSlug]);

  if (isLoading) return <ProductPageSkeleton />;
  if (!product) return <ProductNotFound />;

  return (
    <div className="mx-auto max-w-screen-2xl px-2 pb-12 pt-20 selection:bg-secondary-container selection:text-on-secondary-container sm:px-2 lg:px-8">
      <ProductHeader
        product={product}
        onStickyInfoChange={setStickyInfo}
        addToCartButtonRef={addToCartRef}
        buyNowButtonRef={buyNowRef}
      />

      {/* Floating bar becomes visible after ProductHeader scrolls out */}
      <div ref={floatingSentinelRef} className="h-px w-full" />

      {stickyInfo && (
        <DesktopFloatingPurchaseBar
          visible={floatingVisible}
          currencySymbol={stickyInfo.currencySymbol}
          name={stickyInfo.name}
          imageUrls={floatingImageUrls}
          price={stickyInfo.price}
          originalPrice={stickyInfo.originalPrice ?? null}
          qty={stickyInfo.qty}
          inCart={stickyInfo.inCart}
          isOutOfStock={stickyInfo.isOutOfStock}
          onAddToCart={() => {
            if (stickyInfo.inCart) {
              router.push('/cart');
              return;
            }
            try {
              const imageContainer = document.querySelector('[data-floating-bar-image]') as HTMLElement | null;
              const img = imageContainer?.querySelector('img') as HTMLImageElement | null;
              const fromRect = img?.getBoundingClientRect?.();
              const imageUrl = String(img?.currentSrc || img?.src || '').trim();
              if (fromRect && imageUrl) {
                flyImageToCart({ imageUrl, fromRect });
              }
            } catch {
              // ignore
            }
            addToCartRef.current?.click();
          }}
          onBuyNow={() => buyNowRef.current?.click()}
        />
      )}
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-0">
        <NutritionFacts product={product} />
        <WellnessPath />
        <ReviewsAndSimilar product={product} />
        <PromiseBanner />
      </div>
    </div>
  );
}

