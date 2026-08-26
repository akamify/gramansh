import type { Product, WeightVariant } from '@/app/data/products';
import { formatProductNameForPath } from '@/app/data/products';
import { getBackendBaseUrlCandidates } from '@/app/lib/session';

type GenericRecord = Record<string, unknown>;

function asRecord(value: unknown): GenericRecord {
    return value && typeof value === 'object' ? (value as GenericRecord) : {};
}

const HTML_ENTITY_MAP: Record<string, string> = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    '#39': "'",
};

function decodeHtmlEntities(value: unknown) {
    const input = String(value || '');
    if (!input.includes('&')) return input;

    return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
        const key = String(entity).toLowerCase();
        if (key in HTML_ENTITY_MAP) {
            return HTML_ENTITY_MAP[key];
        }

        if (key.startsWith('#x')) {
            const codePoint = Number.parseInt(key.slice(2), 16);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }

        if (key.startsWith('#')) {
            const codePoint = Number.parseInt(key.slice(1), 10);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }

        return match;
    });
}

function mapCategoryName(raw: GenericRecord) {
    const categoryObject = asRecord(raw.catagory_id);
    const legacyCategory = asRecord(raw.Catagory);

    if (typeof categoryObject.name === 'string') {
        return categoryObject.name;
    }
    if (typeof legacyCategory.name === 'string') return legacyCategory.name;
    return 'Shop';
}

function mapDetails(raw: GenericRecord) {
    const highlights = Array.isArray(raw.key_highlights) ? raw.key_highlights : [];
    const specs = Array.isArray(raw.specifications) ? raw.specifications : [];

    if (highlights.length > 0) {
        return highlights
            .map((entry) => {
                const item = asRecord(entry);
                const key = typeof item.key === 'string' ? item.key : '';
                const value = typeof item.value === 'string' ? item.value : '';
                if (key && value) return `${key}: ${value}`;
                return value || key || '';
            })
            .filter(Boolean);
    }

    if (specs.length > 0) {
        return specs
            .map((entry) => {
                const item = asRecord(entry);
                const key = typeof item.key === 'string' ? item.key : '';
                const value = typeof item.value === 'string' ? item.value : '';
                if (key && value) return `${key}: ${value}`;
                return value || key || '';
            })
            .filter(Boolean);
    }

    return ['Curated product details'];
}

function mapKeyValuePairs(value: unknown): Array<{ key: string; value: string }> {
    const rows = Array.isArray(value) ? value : [];
    return rows
        .map((entry) => {
            const item = asRecord(entry);
            const key = String(item.key || '').trim();
            const pairValue = String(item.value || '').trim();
            if (!key && !pairValue) return null;
            return {
                key: key || 'Details',
                value: pairValue || '—',
            };
        })
        .filter((entry): entry is { key: string; value: string } => entry !== null);
}

function stripHtml(value: unknown) {
    const raw = String(value || '');
    return raw
        .replace(/<br\s*\/?\s*>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeToken(value: unknown) {
    return String(value || '').trim().toLowerCase();
}

function isEnabledFlag(value: unknown) {
    if (value === true) return true;
    if (typeof value === 'number') return value === 1;
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'enabled';
}

function buildStockMaps(raw: GenericRecord) {
    const variants = Array.isArray(raw.variants) ? raw.variants : [];
    const stockBySize: Record<string, number> = {};
    const stockByVariant: Record<string, number> = {};
    const variantPrices: Record<string, number> = {};
    const variantData: Array<{
        label: string;
        stock: number;
        price: number;
        originalPrice?: number;
        image?: string;
        images?: string[];
    }> = [];

    variants.forEach((variant) => {
        const row = asRecord(variant);
        const label = normalizeToken(row.label);
        const stock = Math.max(0, Number(row.stock || 0));
        const price = Number(row.selling_price ?? row.price ?? 0);
        const originalPrice = Number(row.originalPrice ?? row.original_price ?? row.price ?? 0) || undefined;
        const imagesArray = (row as unknown as { images?: unknown }).images;
        const normalizedImages = Array.isArray(imagesArray)
            ? imagesArray
                .map((img) => (typeof img === 'string' ? img.trim() : ''))
                .filter(Boolean)
            : [];
        const imageFromImagesArray = normalizedImages[0] || undefined;

        const image = imageFromImagesArray && imageFromImagesArray.length > 0
            ? imageFromImagesArray
            : typeof row.image === 'string' && row.image.trim().length > 0
                ? row.image
                : typeof row.variant_image === 'string' && row.variant_image.trim().length > 0
                    ? row.variant_image
                    : typeof row.existingImage === 'string' && row.existingImage.trim().length > 0
                        ? row.existingImage
                        : undefined;

        if (!label) return;

        stockByVariant[label] = stock;
        stockBySize[label] = stock;
        variantPrices[label] = price;
        variantData.push({
            label,
            stock,
            price,
            originalPrice,
            image,
            images: normalizedImages.length ? normalizedImages : undefined,
        });
    });

    return { stockBySize, stockByVariant, variantPrices, variantData };
}

export function matchVariantByCartSize(
    product: Pick<Product, 'variants'>,
    cartSize: string
): WeightVariant | undefined {
    const target = normalizeToken(cartSize);
    if (!target) return undefined;
    return product.variants?.find((variant) => normalizeToken(variant?.label) === target);
}

export function normalizeBackendProduct(input: unknown): Product {
    const raw = asRecord(input);
    const id = Number(raw.product_id ?? raw.id ?? 0);
    const publicId = typeof raw.product_code === 'string' ? raw.product_code : undefined;
    const name = String(raw.name || raw.title || `Product ${id || ''}` || 'Product').trim();
    const category = mapCategoryName(raw);
    const imageList = Array.isArray(raw.product_image)
        ? raw.product_image.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];

    // Build variant maps first so we can derive fallbacks from variant data
    const { stockBySize, stockByVariant, variantPrices, variantData } = buildStockMaps(raw);

    // If we have weight variants, use them as sizes and use variant-specific prices
    const hasVariantData = variantData.length > 0;

    // Prefer product images, fall back to top-level image, then to first variant image, then fallback
    const image = typeof imageList[0] === 'string'
        ? imageList[0]
        : typeof raw.image === 'string' && raw.image.trim().length > 0
            ? raw.image
            : (hasVariantData && variantData[0] && variantData[0].image) ? variantData[0].image : '';

    const originalPriceNumber = Number(raw.price ?? 0);
    const priceNumber = Number(raw.selling_price ?? raw.price ?? (hasVariantData ? (variantData[0].price ?? 0) : 0));

    // Fix possible swapped price/original values coming from backend variants
    // Ensure each variant has `price` as selling (lower) and `originalPrice` as MRP (higher)
    if (hasVariantData) {
        for (const v of variantData) {
            if (typeof v.originalPrice === 'number' && v.originalPrice > 0 && v.originalPrice < v.price) {
                const tmp = v.originalPrice;
                v.originalPrice = v.price;
                v.price = tmp;
            }
        }
    }

    // Derive product-level selling and original price, preferring variant values when available
    let priceCandidate = hasVariantData && variantData[0] ? (variantData[0].price ?? 0) : priceNumber;
    let originalCandidate: number | undefined = hasVariantData && variantData[0] && typeof variantData[0].originalPrice === 'number' && variantData[0].originalPrice > 0
        ? variantData[0].originalPrice
        : (Number.isFinite(originalPriceNumber) && originalPriceNumber > 0 ? originalPriceNumber : undefined);

    if ((!priceCandidate || priceCandidate === 0) && Number.isFinite(priceNumber)) {
        priceCandidate = priceNumber;
    }
    if ((!originalCandidate || originalCandidate === 0) && Number.isFinite(originalPriceNumber) && originalPriceNumber > 0) {
        originalCandidate = originalPriceNumber;
    }

    // If backend stored the fields reversed (original < selling), swap them so selling <= original
    if (typeof originalCandidate === 'number' && originalCandidate > 0 && originalCandidate < priceCandidate) {
        const tmp = originalCandidate;
        originalCandidate = priceCandidate;
        priceCandidate = tmp;
    }

    const quantityFromRaw = Math.max(0, Number(raw.quantity ?? 0));
    const quantity = quantityFromRaw > 0 ? quantityFromRaw : (hasVariantData ? variantData.reduce((s, v) => s + (v.stock || 0), 0) : 0);
    const rawDescription = decodeHtmlEntities(raw.description).trim();
    const normalizedDescription = stripHtml(rawDescription) || 'No description available.';
    const sizes = hasVariantData
        ? variantData.map(v => v.label) // Use variant labels like "500g", "1kg" as sizes
        : (Array.isArray(raw.sizes) && raw.sizes.length > 0 ? raw.sizes.map(String) : ['Default']);

    const imagesCombined = (() => {
        const candidate = [
            ...imageList,
            ...(typeof raw.image === 'string' && raw.image.trim() ? [raw.image.trim()] : []),
            ...(hasVariantData
                ? variantData.flatMap((variant) => {
                    const list = Array.isArray(variant.images) && variant.images.length
                        ? variant.images
                        : (variant.image ? [variant.image] : []);
                    return list.filter(Boolean);
                })
                : []),
        ];

        const uniq: string[] = [];
        for (const url of candidate) {
            const u = String(url || '').trim();
            if (!u) continue;
            if (!uniq.includes(u)) uniq.push(u);
        }
        return uniq;
    })();

    // Build a product that supports multiple weight variants
    const product: Product = {
        id,
        publicId,
        name,
        slug: formatProductNameForPath(name),
        price: Number.isFinite(priceCandidate) ? priceCandidate : 0,
        originalPrice: (typeof originalCandidate === 'number' && Number.isFinite(originalCandidate) && originalCandidate > (Number.isFinite(priceCandidate) ? priceCandidate : 0)) ? originalCandidate : undefined,
        quantity,
        stockBySize,
        stockByVariant,
        variantPrices, // Per-variant pricing
        variants: variantData, // Full variant data
        codAvailable: isEnabledFlag(raw.cod_available) || isEnabledFlag(raw.codAvailable),
        collection: String(category || 'SHOP').toUpperCase(),
        category,
        tag: quantity <= 0 ? 'Out of Stock' : undefined,
        colors: undefined, // No color variants for weight-based products
        sizes,
        image,
        images: imagesCombined,
        description: normalizedDescription,
        descriptionHtml: rawDescription || undefined,
        details: mapDetails(raw),
        ingredients: mapKeyValuePairs(raw.ingredients),
        nutritions: mapKeyValuePairs(raw.nutritions),
        specifications: mapKeyValuePairs(raw.specifications),
    };
    return product;
}

export async function fetchBackendProducts(query?: string): Promise<Product[]> {
    const rawCandidates = getBackendBaseUrlCandidates();
    const baseCandidates = (() => {
        if (typeof window !== 'undefined') {
            const proxy = '/api/backend';
            const others = rawCandidates.filter((entry) => entry !== proxy);
            return [proxy, ...others];
        }
        return rawCandidates;
    })();
    for (const baseUrl of baseCandidates) {
        try {
            const endpoint = query && query.trim().length > 0
                ? `${baseUrl}/user/search?search=${encodeURIComponent(query.trim())}&limit=100`
                : `${baseUrl}/user/show-product?limit=100`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const response = await fetch(endpoint, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) continue;

            const data = (await response.json()) as GenericRecord;
            const list = Array.isArray(data.products)
                ? data.products
                : Array.isArray(data.data)
                    ? data.data
                    : [];

            return list.map(normalizeBackendProduct).filter((item: Product) => Number.isFinite(item.id) && item.id > 0);
        } catch {
            continue;
        }
    }

    return [];
}

export async function fetchBackendProductById(id: string | number): Promise<Product | null> {
    const idValue = String(id || '').trim();
    if (!idValue) return null;

    const rawCandidates = getBackendBaseUrlCandidates();
    const baseCandidates = (() => {
        if (typeof window !== 'undefined') {
            const proxy = '/api/backend';
            const others = rawCandidates.filter((entry) => entry !== proxy);
            return [proxy, ...others];
        }
        return rawCandidates;
    })();
    for (const baseUrl of baseCandidates) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const response = await fetch(`${baseUrl}/user/get-product-byid/${encodeURIComponent(idValue)}`, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) continue;

            const data = (await response.json()) as GenericRecord;
            const rawProduct = Array.isArray(data.data)
                ? data.data[0]
                : asRecord(data.product && typeof data.product === 'object' ? data.product : null);
            if (!rawProduct || (typeof rawProduct === 'object' && Object.keys(asRecord(rawProduct)).length === 0)) continue;

            return normalizeBackendProduct(rawProduct);
        } catch {
            continue;
        }
    }

    return null;
}
