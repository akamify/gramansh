
// Weight Variant type for products with multiple weight options
export interface WeightVariant {
  label: string;      // e.g., "500g", "1kg", "2kg"
  stock: number;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
}

// Main Product type with weight variant support
export interface Product {
  id: number;
  publicId?: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  stockBySize?: Record<string, number>;
  stockByVariant?: Record<string, number>;
  variantPrices?: Record<string, number>;  // Per-variant pricing
  variants?: WeightVariant[];               // Full variant data
  codAvailable?: boolean;
  collection?: string;
  category?: string;
  tag?: string;
  colors?: string[];
  sizes?: string[];
  image: string;
  images?: string[];
  description?: string;
  descriptionHtml?: string;
  details?: string[];
  ingredients?: Array<{ key: string; value: string }>;
  nutritions?: Array<{ key: string; value: string }>;
  specifications?: Array<{ key: string; value: string }>;
}

export function getProductImageSources(product?: Product | null, variantLabel?: string) {
  if (!product) return [];
  const normalizedVariant = String(variantLabel || '').trim().toLowerCase();
  const selectedVariant = product.variants?.find(
    (variant) => String(variant.label || '').trim().toLowerCase() === normalizedVariant
  );
  const candidates = [
    ...(selectedVariant?.images || []),
    selectedVariant?.image,
    ...(product.images || []),
    product.image,
    ...(product.variants || []).flatMap((variant) => [
      ...(variant.images || []),
      variant.image,
    ]),
  ];
  return Array.from(new Set(candidates.map((source) => String(source || '').trim()).filter(Boolean)));
}

// Local mock products array (fallback)
const products: Product[] = [];

export function getProductById(id: number): Product | undefined {
  return products.find(p => p.id === id);
}

export function formatProductNameForPath(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createProductHref(product: {
  id: number;
  publicId?: string;
  name: string;
  collection?: string;
  price?: number;
  image?: string;
  description?: string;
  category?: string;
  tag?: string;
  details?: string[];
  sizes?: string[];
}, variant?: string) {
  const routeId = product.publicId || String(product.id);
  const pathname = `/product/${routeId}/${formatProductNameForPath(product.name)}`;
  const normalizedVariant = String(variant || '').trim();
  return normalizedVariant ? `${pathname}?variant=${encodeURIComponent(normalizedVariant)}` : pathname;
}

export function getProductBySlug(slug: string) {
  return products.find(p => p.slug === slug);
}

export function searchProducts(query: string, category?: string, sizes?: string[]) {
  return products.filter(p => {
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.collection?.toLowerCase().includes(query.toLowerCase()) ?? false);
    const matchesCategory = !category || category === 'ALL' || p.category === category;
    const matchesSizes =
      !sizes || sizes.length === 0 || (p.sizes ?? []).some((s) => sizes.includes(s));
    return matchesQuery && matchesCategory && matchesSizes;
  });
}
