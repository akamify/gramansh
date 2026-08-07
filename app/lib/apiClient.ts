// --- ADMIN PRODUCT & CATEGORY API ---
export async function fetchAdminCategoriesTree(): Promise<Record<string, unknown>[]> {
    const data = await request('/admin/categories/tree');
    return Array.isArray(data.categories) ? data.categories : [];
}

export async function createAdminCategory(name: string, parentId?: string) {
    const payload = parentId ? { name, parentId } : { name };
    return request('/admin/add-catagory', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// Tries a few likely backend endpoints since this project has multiple
// "catagory/category" spellings across routes.
export async function updateAdminCategory(categoryId: string, name: string) {
    const payload = { name };
    const candidates: Array<{ path: string; options: RequestInit }> = [
        {
            path: `/admin/update-catagory/${encodeURIComponent(categoryId)}`,
            options: { method: 'PATCH', body: JSON.stringify(payload) },
        },
        {
            path: `/admin/update-category/${encodeURIComponent(categoryId)}`,
            options: { method: 'PATCH', body: JSON.stringify(payload) },
        },
        {
            path: `/admin/update-catagory`,
            options: { method: 'PATCH', body: JSON.stringify({ id: categoryId, name }) },
        },
        {
            path: `/admin/update-category`,
            options: { method: 'PATCH', body: JSON.stringify({ id: categoryId, name }) },
        },
    ];

    let lastErr: unknown;
    for (const c of candidates) {
        try {
            return await request(c.path, c.options);
        } catch (err) {
            lastErr = err;
        }
    }

    throw lastErr instanceof Error ? lastErr : new Error('Failed to rename category.');
}

export async function deleteAdminProduct(productId: number, mongoId?: string) {
    const params = new URLSearchParams();
    if (Number.isFinite(productId) && productId > 0) {
        params.set('product_id', String(productId));
    }
    if (mongoId && mongoId.trim()) {
        params.set('id', mongoId.trim());
    }
    return request(`/admin/delete-product?${params.toString()}`, {
        method: 'DELETE',
    });
}

export async function createAdminProduct(form: FormData) {
    return request('/admin/upload-product', {
        method: 'POST',
        body: form,
    });
}

export async function updateAdminProduct(productId: number, form: FormData) {
    return request(`/admin/update-product/${productId}`, {
        method: 'PATCH',
        body: form,
    });
}
import type { Product } from '@/app/data/products';
import { normalizeBackendProduct } from '@/app/lib/backendProducts';
import { clearUserSession, getBackendBaseUrlCandidates, getCartId, getUserEmail, getUserToken, setCartId } from '@/app/lib/session';
import { clearAdminSession, getAdminToken } from '@/app/lib/adminSession';

type AnyRecord = Record<string, unknown>;

export interface CartPayloadItem {
    product_id: number;
    color: string;
    size: string;
    qty: number;
    price: number;
    mrp: number;
    title: string;
    image: string;
}

export interface UserAddress {
    id: number;
    address_id: number;
    FullName: string;
    phone1: string;
    phone2: string;
    email: string;
    country: string;
    state: string;
    city: string;
    district: string;
    pinCode: string;
    address: string;
    address_line2: string;
    addressType: string;
}

export type UserAddressInput = Omit<UserAddress, 'id' | 'address_id' | 'email'>;

export interface AdminOrderItem {
    product_id: number;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
    product_name?: string;
    product_image?: string;
    product_images?: string[];
}

export interface AdminOrderStatusHistoryEntry {
    status: string;
    statusCode?: string;
    timestamp?: string;
    rawTimestamp?: string;
    location?: string;
    activity?: string;
}

export interface AdminOrderShiprocket {
    source?: string;
    currentStatus?: string;
    statusCode?: string;
    statuses: string[];
    statusHistory: AdminOrderStatusHistoryEntry[];
    trackingUrl?: string;
    awb?: string;
    shipmentId?: number | null;
    orderId?: number | null;
}

export interface AdminOrderAddress {
    FullName?: string;
    phone1?: string;
    phone2?: string;
    email?: string;
    country?: string;
    state?: string;
    city?: string;
    district?: string;
    pinCode?: string;
    address?: string;
    address_line1?: string;
    address_line2?: string;
    addressType?: string;
}

export interface AdminOrder {
    _id?: string;
    order_id?: string;
    order_code?: string;
    status: string;
    payment_status?: string;
    payment_method?: string;
    refund_reason?: string;
    refund_upi_id?: string;
    refund_request_type?: string;
    refund_requested_at?: string;
    amount?: number;
    createdAt?: string;
    FullName?: string;
    user_email?: string;
    currency?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    shiprocket_order_id?: number;
    shiprocket_shipment_id?: number;
    shiprocket_awb?: string;
    delivery_provider?: string;
    courier_name?: string;
    courier_etd?: number;
    shiprocket_error?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    pinCode?: string;
    phone1?: string;
    phone2?: string;
    addressType?: string;
    shiprocket?: AdminOrderShiprocket;
    address?: AdminOrderAddress | null;
    status_history?: AdminOrderStatusHistoryEntry[];
    items: AdminOrderItem[];
}

export interface AdminCustomer {
    email: string;
    name: string;
    ordersCount: number;
    totalSpent: number;
    lastOrderAt: string | null;
    activeSessions: number;
    status: string;
}

export interface AdminCustomerOverview {
    stats: {
        totalCustomers: number;
        activeSessions: number;
        conversionRate: number;
        churnRate: number;
    };
    customers: AdminCustomer[];
}

export interface NewsletterSubscriber {
    id: string;
    email: string;
    source: string;
    isActive: boolean;
    subscribedAt: string | null;
    lastNotifiedAt: string | null;
    lastNotifiedType: string;
}

export interface ContactSubmission {
    id: string;
    ticketCode: string;
    name: string;
    email: string;
    department: string;
    message: string;
    status: 'open' | 'solved';
    solvedAt: string | null;
    solvedBy: string;
    resolutionMessage: string;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface ProductNotifyRequest {
    id: string;
    email: string;
    product_id: number;
    product_name: string;
    color?: string;
    size?: string;
    source: string;
    status: 'pending' | 'notified';
    isActive: boolean;
    requestedAt: string | null;
    notifiedAt: string | null;
    updatedAt: string | null;
}

export interface AdminReviewProductMeta {
    product_id: number;
    product_code: string;
    product_name: string;
    product_image: string;
}

export interface AdminReview {
    id: string;
    product_id: number;
    product: AdminReviewProductMeta;
    review_rate: number;
    review_text: string;
    review_title: string;
    review_image: string;
    review_images: string[];
    user_name: string;
    createdAt: string | null;
    user_stats: {
        totalReviews: number;
        reviewedProducts: AdminReviewProductMeta[];
    };
}

export interface SiteSettings {
    siteName: string;
    navbarTitle: string;
    footerTitle: string;
    footerDescription: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone: string;
    emailFooterDescription: string;
    logoUrl: string;
    logoPublicId?: string;
    currencySymbol: string;
    instagramUrl: string;
    instagramHandle: string;
    instagramGallery: Array<{
        id: string;
        imageUrl: string;
        imagePublicId?: string;
        username: string;
        sortOrder: number;
        isActive: boolean;
    }>;
    twitterUrl: string;
    youtubeUrl: string;
    facebookUrl: string;
    updatedBy?: string;
    updatedAt?: string | null;
}

export interface AdminBanner {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    imagePublicId?: string;
    targetUrl: string;
    width: number;
    height: number;
    order: number;
    isActive: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface AdminTestimonial {
    id: string;
    quote: string;
    name: string;
    role: string;
    order: number;
    isActive: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface AdminAnalyticsOverview {
    periodDays: number;
    metrics: {
        averageOrderValue: number;
        averageOrderValueTrend: number;
        customerLtv: number;
        customerLtvTrend: number;
        repurchaseRate: number;
        repurchaseRateTrend: number;
        cartAbandonment: number;
        cartAbandonmentTrend: number;
    };
    regional: Array<{
        region: string;
        currentRevenue: number;
        previousRevenue: number;
        growthPercent: number;
    }>;
    topProducts: {
        mostAddedToCart: Array<{
            productId: number;
            productName: string;
            productImage: string;
            metric: number;
        }>;
        mostWishlisted: Array<{
            productId: number;
            productName: string;
            productImage: string;
            metric: number;
        }>;
        mostOrdered: Array<{
            productId: number;
            productName: string;
            productImage: string;
            metric: number;
        }>;
        bestSelling: Array<{
            productId: number;
            productName: string;
            productImage: string;
            metric: number;
        }>;
    };
    performanceIndex: number;
    notes: string;
}

export interface AdminProductLite {
    _id?: string;
    product_id?: number;
    createdAt?: string;
    name?: string;
    title?: string;
    collection?: string;
    category?: string;
    sku?: string;
    description?: string;
    key_highlights?: Array<{ key: string; value: string }>;
    ingredients?: Array<{ key: string; value: string }>;
    nutritions?: Array<{ key: string; value: string }>;
    specifications?: Array<{ key: string; value: string }>;
    catagory_id?: { _id?: string; name?: string } | string;
    variants?: Array<{
        label: string;
        stock: number;
        price: number;
        originalPrice?: number;
        selling_price?: number;
        image?: string;
    }>;
    image?: string;
    product_image?: string[];
    price?: number;
    selling_price?: number;
    quantity?: number;
    status?: string;
    cod_available?: boolean | string;
    codAvailable?: boolean | string;
}

export interface PromoCodeConfig {
    id: string;
    code: string;
    description: string;
    scope: 'CART' | 'PRODUCT';
    discountType: 'PERCENT' | 'FLAT';
    discountValue: number;
    minCartValue: number;
    maxDiscount: number;
    requiredProductId: number;
    requiredQty: number;
    startAt: string | null;
    endAt: string | null;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface PromoValidationResult {
    code: string;
    description: string;
    scope: 'CART' | 'PRODUCT';
    discountType: 'PERCENT' | 'FLAT';
    discountValue: number;
    requiredProductId?: number;
    requiredQty: number;
    minCartValue: number;
    maxDiscount: number;
    subtotal: number;
    discountAmount: number;
    totalAfterDiscount: number;
}

export interface PublicPromo {
    code: string;
    description: string;
    scope: 'CART' | 'PRODUCT';
    discountType: 'PERCENT' | 'FLAT';
    discountValue: number;
    requiredProductId?: number;
    requiredQty: number;
}

type SiteSettingsInstagramItem = SiteSettings['instagramGallery'][number];

export interface AdminCustomerActivity {
    customer: {
        email: string;
        name: string;
        isBlocked: boolean;
        blockedReason: string;
        blockedAt: string | null;
    };
    summary: {
        activeSessions: number;
        ordersCount: number;
        totalSpent: number;
        wishlistCount: number;
        recentSearches: string[];
        recentViewed: number[];
    };
    orders: Array<{
        orderId: number | null;
        orderCode: string;
        status: string;
        amount: number;
        itemCount: number;
        createdAt: string | null;
    }>;
    wishlist: Array<{
        productId: number;
        productCode: string;
        name: string;
        price: number;
        image: string;
        addedAt: string | null;
    }>;
    cartEvents: Array<{
        type: string;
        title: string;
        occurredAt: string | null;
        metadata?: Record<string, unknown>;
    }>;
    timeline: Array<{
        type: string;
        title: string;
        occurredAt: string | null;
        order_code?: string;
        product_id?: number;
        metadata?: Record<string, unknown>;
    }>;
}

function asRecord(value: unknown): AnyRecord {
    return value && typeof value === 'object' ? (value as AnyRecord) : {};
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

function mapAddress(row: AnyRecord): UserAddress {
    const id = Number(row.address_id || row.id || 0);
    return {
        id,
        address_id: id,
        FullName: String(row.FullName || ''),
        phone1: String(row.phone1 || ''),
        phone2: String(row.phone2 || ''),
        email: String(row.email || ''),
        country: String(row.country || 'India'),
        state: String(row.state || ''),
        city: String(row.city || ''),
        district: String(row.district || ''),
        pinCode: String(row.pinCode || ''),
        address: String(row.address || ''),
        address_line2: String(row.address_line2 || ''),
        addressType: String(row.addressType || 'Home'),
    };
}

async function request(path: string, options: RequestInit = {}, auth = false) {
    const baseCandidates = getBackendBaseUrlCandidates();
    const headers = new Headers(options.headers || {});
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (!isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (auth) {
        const token = getUserToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }
    const adminToken = getAdminToken();
    if (adminToken) {
        headers.set('x-admin-token', adminToken);
    }

    let response: Response | null = null;
    let lastBase = baseCandidates[0] || '';

    for (const base of baseCandidates) {
        lastBase = base;
        try {
            response = await fetch(`${base}${path}`, {
                ...options,
                headers,
                cache: 'no-store',
            });
            break;
        } catch {
            response = null;
        }
    }

    if (!response) {
        throw new Error(`Failed to fetch. Check backend server and CORS at ${lastBase}`);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const normalized = asRecord(data);
        const message =
            (normalized.message as string) ||
            (normalized.msg as string) ||
            `Request failed: ${response.status}`;
        const isAdminRequest = path.startsWith('/admin');
        const isPublicAdminEndpoint = /\/public(?:$|[/?])/.test(path);
        const isOnAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        if (
            isAdminRequest &&
            !isPublicAdminEndpoint &&
            isOnAdminRoute &&
            (response.status === 401 || response.status === 403) &&
            /token|expired|auth|unauthorized|forbidden|session/i.test(String(message || ''))
        ) {
            clearAdminSession();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
                window.location.replace('/admin/login');
            }
        }
        if (
            auth &&
            (response.status === 401 || response.status === 403) &&
            /blocked|auth|unauthorized|forbidden/i.test(String(message || ''))
        ) {
            clearUserSession();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/user/auth')) {
                const blocked = /blocked/i.test(String(message || ''));
                const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
                const authParams = new URLSearchParams();
                authParams.set('returnTo', currentPath);
                if (blocked) authParams.set('blocked', '1');
                window.location.replace(`/user/auth?${authParams.toString()}`);
            }
        }
        throw new Error(message);
    }
    return asRecord(data);
}

export async function sendOtp(email: string) {
    return request('/api/auth/log', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function subscribeNewsletter(email: string, source = 'website') {
    return request('/user/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, source }),
    });
}

export async function submitContactForm(payload: {
    name: string;
    email: string;
    department: string;
    message: string;
}) {
    return request('/user/contact/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function registerProductStockNotify(payload: {
    product_id: number;
    product_name?: string;
    color?: string;
    size?: string;
    source?: string;
    email?: string;
}) {
    const email = payload.email || getUserEmail();
    return request('/user/product-notify/register', {
        method: 'POST',
        body: JSON.stringify({
            product_id: payload.product_id,
            product_name: payload.product_name,
            color: payload.color || '',
            size: payload.size || '',
            source: payload.source || 'product_detail',
            email,
        }),
    });
}

export async function fetchProductStockNotifyStatus(productId: number, email?: string, color?: string, size?: string) {
    const resolvedEmail = email || getUserEmail();
    if (!resolvedEmail || !productId) {
        return { isNotified: false };
    }

    const query = new URLSearchParams({
        product_id: String(productId),
        email: resolvedEmail,
        color: color || '',
        size: size || '',
    });

    const data = await request(
        `/user/product-notify/status?${query.toString()}`,
        { method: 'GET' },
    );

    return {
        isNotified: Boolean(data.isNotified),
        request: data.request,
    };
}

export async function verifyOtp(email: string, otp: string) {
    const data = await request('/api/auth/varify-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
    });

    return {
        token: String(data.token || ''),
        email: String(data.email || email),
        isNew: Boolean(data.isNew),
        profile: asRecord(data.profile),
    };
}

export async function fetchUserProfile() {
    const email = getUserEmail();
    if (!email) throw new Error('Not authenticated');
    return request('/user/get-user-profile', { method: 'POST', body: JSON.stringify({ email }) }, true);
}

export async function updateUserProfile(payload: { name: string; phone?: string; gender?: string }) {
    const email = getUserEmail();
    if (!email) throw new Error('Not authenticated');
    return request('/user/update-user-profile', { method: 'POST', body: JSON.stringify({ ...payload, email }) }, true);
}

export async function fetchWishlistProducts(): Promise<Product[]> {
    const email = getUserEmail();
    if (!email) return [];
    const data = await request('/user/wishlist/list', { method: 'POST', body: JSON.stringify({ email }) }, true);
    const products = Array.isArray(data.products) ? data.products : [];
    return products.map(normalizeBackendProduct);
}

export async function addWishlistProduct(productId: number) {
    const email = getUserEmail();
    return request('/user/wishlist/add', {
        method: 'POST',
        body: JSON.stringify({ email, product_id: productId }),
    }, true);
}

export async function removeWishlistProduct(productId: number) {
    const email = getUserEmail();
    return request('/user/wishlist/remove', {
        method: 'POST',
        body: JSON.stringify({ email, product_id: productId }),
    }, true);
}

export async function fetchCartItems() {
    const cart_id = getCartId();
    const data = await request('/user/get-user-cart', {
        method: 'POST',
        body: JSON.stringify({ cart_id }),
    });
    if (typeof data.cart_id === 'string' && data.cart_id) setCartId(data.cart_id);
    return Array.isArray(data.items) ? data.items : [];
}

export async function addCartItem(item: CartPayloadItem) {
    const payload = { cart_id: getCartId(), email: getUserEmail(), ...item };
    const data = await request('/user/add-to-cart', { method: 'POST', body: JSON.stringify(payload) });
    if (typeof data.cart_id === 'string' && data.cart_id) setCartId(data.cart_id);
    return Array.isArray(data.items) ? data.items : [];
}

export async function updateCartItem(productId: number, size: string, qty: number, color = '') {
    const payload = { cart_id: getCartId(), email: getUserEmail(), product_id: productId, color, size, qty };
    const data = await request('/user/update-cart-item', { method: 'POST', body: JSON.stringify(payload) });
    return Array.isArray(data.items) ? data.items : [];
}

export async function clearCartItems() {
    const payload = { cart_id: getCartId(), email: getUserEmail() };
    const data = await request('/user/clear-cart', { method: 'POST', body: JSON.stringify(payload) });
    return Array.isArray(data.items) ? data.items : [];
}

export async function fetchOrders() {
    const email = getUserEmail();
    const data = await request('/user/get-orders', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }, true);
    return Array.isArray(data.orders) ? data.orders : [];
}

export async function fetchUserAddresses(): Promise<UserAddress[]> {
    const email = getUserEmail();
    const data = await request('/user/get-user-addresess', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }, true);
    const rows = Array.isArray(data.addresses) ? data.addresses : Array.isArray(data.data) ? data.data : [];
    return rows.map((entry) => mapAddress(asRecord(entry)));
}

export async function createUserAddress(payload: UserAddressInput): Promise<UserAddress> {
    const email = getUserEmail();
    if (!email) throw new Error('Not authenticated');
    const data = await request('/user/create-newAddress', {
        method: 'POST',
        body: JSON.stringify({ ...payload, email }),
    }, true);
    return mapAddress(asRecord(data.address || data.data));
}

export async function updateUserAddress(addressId: number, payload: UserAddressInput): Promise<UserAddress> {
    const email = getUserEmail();
    if (!email) throw new Error('Not authenticated');
    const data = await request('/user/update-user-address', {
        method: 'PATCH',
        body: JSON.stringify({ address_id: addressId, ...payload, email }),
    }, true);
    return mapAddress(asRecord(data.address || data.data));
}

export async function createBackendOrder(
    items: Array<{ product_id: number; quantity: number; size: string; color?: string; price?: number }>,
    address_id?: number,
    promo_code?: string,
    payment_method?: 'Razorpay' | 'COD',
) {
    const email = getUserEmail();
    const cart_id = getCartId();
    return request('/user/create-order', {
        method: 'POST',
        body: JSON.stringify({ items, address_id: address_id || null, email, cart_id, promo_code: promo_code || '', payment_method: payment_method || 'Razorpay' }),
    }, true);
}

export async function verifyBackendPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    items?: Array<{ product_id: number; quantity: number; size?: string; color?: string; price?: number }>;
    address_id?: number;
    email?: string;
    cart_id?: string;
}) {
    const cart_id = payload.cart_id || getCartId();
    return request('/user/payment-success', {
        method: 'POST',
        body: JSON.stringify({ ...payload, cart_id }),
    }, true);
}

export async function validatePromoCode(payload: {
    code: string;
    items: Array<{ product_id: number; quantity: number; size?: string; color?: string; price?: number }>;
}) {
    const data = await request('/user/validate-promo', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    const promo = asRecord(data.promo);
    return {
        code: String(promo.code || ''),
        description: String(promo.description || ''),
        scope: (String(promo.scope || 'CART').toUpperCase() === 'PRODUCT' ? 'PRODUCT' : 'CART') as PromoValidationResult['scope'],
        discountType: (String(promo.discountType || 'FLAT').toUpperCase() === 'PERCENT' ? 'PERCENT' : 'FLAT') as PromoValidationResult['discountType'],
        discountValue: Number(promo.discountValue || 0),
        requiredProductId: Number(promo.requiredProductId || 0) || undefined,
        requiredQty: Number(promo.requiredQty || 1) || 1,
        minCartValue: Number(promo.minCartValue || 0),
        maxDiscount: Number(promo.maxDiscount || 0),
        subtotal: Number(data.subtotal || 0),
        discountAmount: Number(data.discountAmount || 0),
        totalAfterDiscount: Number(data.totalAfterDiscount || 0),
    } as PromoValidationResult;
}

const mapPublicPromo = (value: unknown): PublicPromo => {
    const row = asRecord(value);
    const scope = String(row.scope || 'CART').toUpperCase() === 'PRODUCT' ? 'PRODUCT' : 'CART';
    const discountType = String(row.discountType || 'FLAT').toUpperCase() === 'PERCENT' ? 'PERCENT' : 'FLAT';
    return {
        code: String(row.code || '').toUpperCase(),
        description: String(row.description || ''),
        scope,
        discountType,
        discountValue: Number(row.discountValue || 0),
        requiredProductId: Number(row.requiredProductId || 0) || undefined,
        requiredQty: Number(row.requiredQty || 1) || 1,
    };
};

export async function fetchPublicPromos(productId?: number): Promise<PublicPromo[]> {
    const query = productId ? `?product_id=${encodeURIComponent(String(productId))}` : '';
    const data = await request(`/user/promos/public${query}`);
    const rows = Array.isArray(data.promos) ? data.promos : [];
    return rows.map((entry) => mapPublicPromo(entry));
}

const mapPromo = (value: unknown): PromoCodeConfig => {
    const row = asRecord(value);
    return {
        id: String(row.id || row._id || ''),
        code: String(row.code || '').toUpperCase(),
        description: String(row.description || ''),
        scope: String(row.scope || 'CART').toUpperCase() === 'PRODUCT' ? 'PRODUCT' : 'CART',
        discountType: String(row.discountType || 'FLAT').toUpperCase() === 'PERCENT' ? 'PERCENT' : 'FLAT',
        discountValue: Number(row.discountValue || 0),
        minCartValue: Number(row.minCartValue || 0),
        maxDiscount: Number(row.maxDiscount || 0),
        requiredProductId: Number(row.requiredProductId || 0),
        requiredQty: Number(row.requiredQty || 1),
        startAt: row.startAt ? String(row.startAt) : null,
        endAt: row.endAt ? String(row.endAt) : null,
        usageLimit: Number(row.usageLimit || 0),
        usedCount: Number(row.usedCount || 0),
        isActive: row.isActive !== false,
        createdBy: String(row.createdBy || ''),
        updatedBy: String(row.updatedBy || ''),
        createdAt: row.createdAt ? String(row.createdAt) : null,
        updatedAt: row.updatedAt ? String(row.updatedAt) : null,
    };
};

export async function fetchAdminPromos(): Promise<PromoCodeConfig[]> {
    const data = await request('/admin/promos');
    const rows = Array.isArray(data.promos) ? data.promos : [];
    return rows.map((entry) => mapPromo(entry));
}

export async function createAdminPromo(payload: Partial<PromoCodeConfig>) {
    const data = await request('/admin/promos', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return mapPromo(data.promo);
}

export async function updateAdminPromo(id: string, payload: Partial<PromoCodeConfig>) {
    const data = await request(`/admin/promos/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return mapPromo(data.promo);
}

export async function deleteAdminPromo(id: string) {
    return request(`/admin/promos/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

export async function cancelUserOrder(orderRef: string, reason: string, refundUpiId?: string) {
    const email = getUserEmail();
    return request('/user/cancel-order', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderRef, email, reason, refund_upi_id: refundUpiId || '' }),
    }, true);
}

export async function requestUserOrderReturn(orderRef: string, reason: string, refundUpiId: string) {
    const email = getUserEmail();
    return request('/user/return-order', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderRef, reason, refund_upi_id: refundUpiId, email }),
    }, true);
}

export async function adminLogin(username: string, password: string) {
    return request('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ userName: username, password }),
    });
}

export async function adminResetPassword(username: string, currentPassword: string, newPassword: string) {
    return request('/api/auth/admin-reset', {
        method: 'POST',
        body: JSON.stringify({ username, currentPassword, newPassword }),
    });
}

export async function adminLogout() {
    return request('/api/auth/admin-logout', {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
    const data = await request('/admin/get-orders');
    const rows = Array.isArray(data.orders) ? data.orders : [];

    const normalizeAmount = (explicitAmount: number, items: AdminOrderItem[]) => {
        const itemsTotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
        if (Number.isFinite(explicitAmount) && explicitAmount > 0) {
            if (itemsTotal > 0 && explicitAmount > itemsTotal * 5) return explicitAmount / 100;
            if (itemsTotal <= 0 && explicitAmount >= 100) return explicitAmount / 100;
            return explicitAmount;
        }
        return itemsTotal;
    };

    return rows.map((entry) => {
        const row = asRecord(entry);
        const itemRows = Array.isArray(row.items) ? row.items : [];

        const items: AdminOrderItem[] = itemRows.map((item) => {
            const mapped = asRecord(item);
            const product = asRecord(mapped.product);
            const productImages = Array.isArray(product.product_image) ? product.product_image : [];
            const variants = Array.isArray(product.variants) ? product.variants : [];
            const variantImages = variants.flatMap((variant) => {
                const row = asRecord(variant);
                const images = Array.isArray(row.images) ? row.images : [];
                return [...images, row.image];
            });
            const imageFromItem = typeof mapped.product_image === 'string' && mapped.product_image.trim() ? mapped.product_image : undefined;
            const imageCandidates = Array.from(new Set(
                [...productImages, ...variantImages, imageFromItem]
                    .map((value) => typeof value === 'string' ? value.trim() : '')
                    .filter(Boolean)
            ));
            return {
                product_id: Number(mapped.product_id || 0),
                quantity: Number(mapped.quantity || 0),
                price: Number(mapped.price || 0),
                color: typeof mapped.color === 'string' && mapped.color.trim() ? mapped.color : undefined,
                size: typeof mapped.size === 'string' && mapped.size.trim() ? mapped.size : undefined,
                product_name: typeof mapped.product_name === 'string' && mapped.product_name.trim()
                    ? mapped.product_name
                    : typeof product.title === 'string'
                        ? product.title
                        : typeof product.name === 'string'
                            ? product.name
                            : undefined,
                product_image: imageCandidates[0],
                product_images: imageCandidates,
            };
        });
        const explicitAmount = Number(row.amount || 0);

        return {
            _id: typeof row._id === 'string' ? row._id : undefined,
            order_id: typeof row.order_id === 'string' ? row.order_id : row.order_id ? String(row.order_id) : undefined,
            order_code: typeof row.order_code === 'string' ? row.order_code : undefined,
            status: String(row.status || 'pending'),
            payment_status: typeof row.payment_status === 'string' ? row.payment_status : undefined,
            payment_method: typeof row.payment_method === 'string' ? row.payment_method : undefined,
            refund_reason: typeof row.refund_reason === 'string' ? row.refund_reason : undefined,
            refund_upi_id: typeof row.refund_upi_id === 'string' ? row.refund_upi_id : undefined,
            refund_request_type: typeof row.refund_request_type === 'string' ? row.refund_request_type : undefined,
            refund_requested_at: typeof row.refund_requested_at === 'string' ? row.refund_requested_at : undefined,
            amount: normalizeAmount(explicitAmount, items),
            status_history: (() => {
                const historyRaw = Array.isArray(row.status_history) ? row.status_history : [];
                return historyRaw
                    .map((entry) => {
                        const item = asRecord(entry);
                        const status = String(item.status || '').trim();
                        if (!status) return null;
                        const parsed: AdminOrderStatusHistoryEntry = { status };
                        if (typeof item.updatedAt === 'string') parsed.timestamp = item.updatedAt;
                        if (typeof item.updatedBy === 'string') parsed.activity = item.updatedBy;
                        if (typeof item.note === 'string' && item.note) parsed.location = item.note;
                        return parsed;
                    })
                    .filter((entry): entry is AdminOrderStatusHistoryEntry => entry !== null);
            })(),
            createdAt: typeof row.createdAt === 'string' ? row.createdAt : undefined,
            FullName: typeof row.FullName === 'string' ? row.FullName : undefined,
            user_email: typeof row.user_email === 'string' ? row.user_email : undefined,
            currency: typeof row.currency === 'string' ? row.currency : undefined,
            razorpay_order_id: typeof row.razorpay_order_id === 'string' ? row.razorpay_order_id : undefined,
            razorpay_payment_id: typeof row.razorpay_payment_id === 'string' ? row.razorpay_payment_id : undefined,
            shiprocket_order_id: Number(row.shiprocket_order_id || 0) || undefined,
            shiprocket_shipment_id: Number(row.shiprocket_shipment_id || 0) || undefined,
            shiprocket_awb: typeof row.shiprocket_awb === 'string' ? row.shiprocket_awb : undefined,
            delivery_provider: typeof row.delivery_provider === 'string' ? row.delivery_provider : undefined,
            courier_name: typeof row.courier_name === 'string' ? row.courier_name : undefined,
            courier_etd: Number(row.courier_etd || 0) || undefined,
            shiprocket_error: typeof row.shiprocket_error === 'string' ? row.shiprocket_error : undefined,
            address_line1: typeof row.address_line1 === 'string' ? row.address_line1 : undefined,
            address_line2: typeof row.address_line2 === 'string' ? row.address_line2 : undefined,
            city: typeof row.city === 'string' ? row.city : undefined,
            district: typeof row.district === 'string' ? row.district : undefined,
            state: typeof row.state === 'string' ? row.state : undefined,
            country: typeof row.country === 'string' ? row.country : undefined,
            pinCode: typeof row.pinCode === 'string' ? row.pinCode : undefined,
            phone1: typeof row.phone1 === 'string' ? row.phone1 : undefined,
            phone2: typeof row.phone2 === 'string' ? row.phone2 : undefined,
            addressType: typeof row.addressType === 'string' ? row.addressType : undefined,
            shiprocket: (() => {
                const shipping = asRecord(row.shiprocket);
                const statusesRaw = Array.isArray(shipping.statuses) ? shipping.statuses : [];
                const historyRaw = Array.isArray(shipping.statusHistory) ? shipping.statusHistory : [];
                return {
                    source: typeof shipping.source === 'string' ? shipping.source : undefined,
                    currentStatus: typeof shipping.currentStatus === 'string' ? shipping.currentStatus : undefined,
                    statusCode: typeof shipping.statusCode === 'string' ? shipping.statusCode : undefined,
                    statuses: statusesRaw.map((entry) => String(entry || '').trim()).filter(Boolean),
                    statusHistory: historyRaw
                        .map((entry) => {
                            const item = asRecord(entry);
                            const status = String(item.status || '').trim();
                            if (!status) return null;

                            const parsed: AdminOrderStatusHistoryEntry = { status };
                            if (typeof item.statusCode === 'string') parsed.statusCode = item.statusCode;
                            if (typeof item.timestamp === 'string') parsed.timestamp = item.timestamp;
                            if (typeof item.rawTimestamp === 'string') parsed.rawTimestamp = item.rawTimestamp;
                            if (typeof item.location === 'string') parsed.location = item.location;
                            if (typeof item.activity === 'string') parsed.activity = item.activity;

                            return parsed;
                        })
                        .filter((entry): entry is AdminOrderStatusHistoryEntry => entry !== null),
                    trackingUrl: typeof shipping.trackingUrl === 'string' ? shipping.trackingUrl : undefined,
                    awb: typeof shipping.awb === 'string' ? shipping.awb : undefined,
                    shipmentId: Number(shipping.shipmentId || 0) || undefined,
                    orderId: Number(shipping.orderId || 0) || undefined,
                } as AdminOrderShiprocket;
            })(),
            address: (() => {
                const address = asRecord(row.address);
                if (!Object.keys(address).length) return null;
                return {
                    FullName: typeof address.FullName === 'string'
                        ? address.FullName
                        : typeof address.full_name === 'string'
                            ? address.full_name
                            : undefined,
                    phone1: typeof address.phone1 === 'string'
                        ? address.phone1
                        : typeof address.phone === 'string'
                            ? address.phone
                            : undefined,
                    phone2: typeof address.phone2 === 'string'
                        ? address.phone2
                        : typeof address.alt_phone === 'string'
                            ? address.alt_phone
                            : undefined,
                    email: typeof address.email === 'string' ? address.email : undefined,
                    country: typeof address.country === 'string' ? address.country : undefined,
                    state: typeof address.state === 'string' ? address.state : undefined,
                    city: typeof address.city === 'string' ? address.city : undefined,
                    district: typeof address.district === 'string' ? address.district : undefined,
                    pinCode: typeof address.pinCode === 'string'
                        ? address.pinCode
                        : typeof address.postal_code === 'string'
                            ? address.postal_code
                            : undefined,
                    address: typeof address.address === 'string'
                        ? address.address
                        : typeof address.address_line1 === 'string'
                            ? address.address_line1
                            : undefined,
                    address_line1: typeof address.address_line1 === 'string' ? address.address_line1 : undefined,
                    address_line2: typeof address.address_line2 === 'string' ? address.address_line2 : undefined,
                    addressType: typeof address.addressType === 'string' ? address.addressType : undefined,
                } as AdminOrderAddress;
            })(),
            items,
        } as AdminOrder;
    });
}

export async function fetchAdminProductsLite(): Promise<AdminProductLite[]> {
    const data = await request('/admin/get-products');
    const rows = Array.isArray(data.products) ? data.products : [];
    return rows.map((entry) => {
        const row = asRecord(entry);
        return {
            _id: typeof row._id === 'string' ? row._id : undefined,
            product_id: Number(row.product_id || 0) || undefined,
            createdAt: typeof row.createdAt === 'string' ? row.createdAt : undefined,
            name:
                typeof row.name === 'string'
                    ? row.name
                    : typeof row.title === 'string'
                        ? row.title
                        : undefined,
            title: typeof row.title === 'string' ? row.title : undefined,
            collection: typeof row.collection === 'string' ? row.collection : undefined,
            category: typeof row.category === 'string' ? row.category : undefined,
            sku: typeof row.sku === 'string' ? row.sku : undefined,
            description: typeof row.description === 'string' ? row.description : undefined,
            key_highlights: Array.isArray(row.key_highlights) ? row.key_highlights : undefined,
            ingredients: Array.isArray(row.ingredients) ? row.ingredients : undefined,
            nutritions: Array.isArray(row.nutritions) ? row.nutritions : undefined,
            specifications: Array.isArray(row.specifications) ? row.specifications : undefined,
            catagory_id: row.catagory_id,
            variants: Array.isArray(row.variants) ? row.variants : undefined,
            image:
                Array.isArray(row.product_image) && typeof row.product_image[0] === 'string'
                    ? row.product_image[0]
                    : undefined,
            product_image: Array.isArray(row.product_image) ? row.product_image : undefined,
            // Derive price/selling_price/quantity from variants when top-level
            // fields are absent so variant-driven products display correctly
            // Compute price: prefer top-level `price`, otherwise first variant price
            price: (() => {
                const variantsArr = Array.isArray(row.variants) ? row.variants : [];
                if (row.price !== undefined && row.price !== null) {
                    const v = Number(row.price);
                    return Number.isFinite(v) && v > 0 ? v : undefined;
                }
                if (variantsArr.length) {
                    const v = Number(variantsArr[0].price ?? variantsArr[0].selling_price ?? variantsArr[0].originalPrice ?? 0);
                    return Number.isFinite(v) && v > 0 ? v : undefined;
                }
                return undefined;
            })(),
            // Compute selling_price: prefer top-level, otherwise first variant selling_price/originalPrice/price
            selling_price: (() => {
                const variantsArr = Array.isArray(row.variants) ? row.variants : [];
                if (row.selling_price !== undefined && row.selling_price !== null) {
                    const v = Number(row.selling_price);
                    return Number.isFinite(v) ? v : undefined;
                }
                if (variantsArr.length) {
                    const v = Number(variantsArr[0].selling_price ?? variantsArr[0].originalPrice ?? variantsArr[0].price ?? 0);
                    return Number.isFinite(v) ? v : undefined;
                }
                return undefined;
            })(),
            // Compute quantity: prefer top-level, otherwise sum of variant stocks
            quantity: (() => {
                const variantsArr = Array.isArray(row.variants) ? row.variants : [];
                if (row.quantity !== undefined && row.quantity !== null) {
                    const q = Number(row.quantity);
                    return Number.isFinite(q) ? q : undefined;
                }
                if (variantsArr.length) {
                    return variantsArr.reduce((sum: number, v: unknown) => {
                        const variant = asRecord(v);
                        const stock = Number(variant.stock || 0);
                        return sum + (Number.isFinite(stock) ? stock : 0);
                    }, 0);
                }
                return undefined;
            })(),
            status: typeof row.status === 'string' ? row.status : undefined,
            cod_available: row.cod_available === true || row.cod_available === 'true',
            codAvailable: row.cod_available === true || row.cod_available === 'true' || row.codAvailable === true || row.codAvailable === 'true',
        } as AdminProductLite;
    });
}

export async function updateAdminOrderStatus(orderId: string, status: string, productId?: number) {
    const payload: Record<string, unknown> = {
        order_id: orderId,
        status,
    };
    if (typeof productId === 'number' && Number.isFinite(productId)) {
        payload.product_id = productId;
    }

    return request('/admin/update-order-status', {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export async function fetchAdminOrderLabel(orderRef: string): Promise<{ label_url: string }> {
    const data = await request(`/admin/orders/${encodeURIComponent(orderRef)}/label`);
    const labelUrl = String(data.label_url || '').trim();
    if (!labelUrl) {
        throw new Error('Shiprocket label URL not available for this order.');
    }
    return { label_url: labelUrl };
}

export async function fetchAdminCustomersOverview(): Promise<AdminCustomerOverview> {
    const data = await request('/admin/customers/overview');
    const stats = asRecord(data.stats);
    const customerRows = Array.isArray(data.customers) ? data.customers : [];

    return {
        stats: {
            totalCustomers: Number(stats.totalCustomers || 0),
            activeSessions: Number(stats.activeSessions || 0),
            conversionRate: Number(stats.conversionRate || 0),
            churnRate: Number(stats.churnRate || 0),
        },
        customers: customerRows.map((entry) => {
            const row = asRecord(entry);
            return {
                email: String(row.email || ''),
                name: String(row.name || ''),
                ordersCount: Number(row.ordersCount || 0),
                totalSpent: Number(row.totalSpent || 0),
                lastOrderAt: row.lastOrderAt ? String(row.lastOrderAt) : null,
                activeSessions: Number(row.activeSessions || 0),
                status: String(row.status || 'NEW'),
            } as AdminCustomer;
        }),
    };
}

export async function fetchAdminAnalyticsOverview(days = 30): Promise<AdminAnalyticsOverview> {
    const data = await request(`/admin/analytics/overview?days=${encodeURIComponent(String(days))}`);
    const metrics = asRecord(data.metrics);
    const regionalRows = Array.isArray(data.regional) ? data.regional : [];
    const topProducts = asRecord(data.topProducts);
    const mapTopList = (value: unknown) => {
        const rows = Array.isArray(value) ? value : [];
        return rows.map((entry) => {
            const row = asRecord(entry);
            return {
                productId: Number(row.productId || 0),
                productName: String(row.productName || ''),
                productImage: String(row.productImage || ''),
                metric: Number(row.metric || 0),
            };
        });
    };

    return {
        periodDays: Number(data.periodDays || days),
        metrics: {
            averageOrderValue: Number(metrics.averageOrderValue || 0),
            averageOrderValueTrend: Number(metrics.averageOrderValueTrend || 0),
            customerLtv: Number(metrics.customerLtv || 0),
            customerLtvTrend: Number(metrics.customerLtvTrend || 0),
            repurchaseRate: Number(metrics.repurchaseRate || 0),
            repurchaseRateTrend: Number(metrics.repurchaseRateTrend || 0),
            cartAbandonment: Number(metrics.cartAbandonment || 0),
            cartAbandonmentTrend: Number(metrics.cartAbandonmentTrend || 0),
        },
        regional: regionalRows.map((entry) => {
            const row = asRecord(entry);
            return {
                region: String(row.region || 'UNKNOWN / GLOBAL'),
                currentRevenue: Number(row.currentRevenue || 0),
                previousRevenue: Number(row.previousRevenue || 0),
                growthPercent: Number(row.growthPercent || 0),
            };
        }),
        topProducts: {
            mostAddedToCart: mapTopList(topProducts.mostAddedToCart),
            mostWishlisted: mapTopList(topProducts.mostWishlisted),
            mostOrdered: mapTopList(topProducts.mostOrdered),
            bestSelling: mapTopList(topProducts.bestSelling),
        },
        performanceIndex: Number(data.performanceIndex || 0),
        notes: String(data.notes || ''),
    };
}

const DEFAULT_INSTAGRAM_GALLERY_URLS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBB6krFZt3NforzP_CzR4ptQE8-y0eealOxaiOFyw-M_PiEaPfHJmpJx0KQ69PoCCe-8I9bO5ABXLOBzrYtxX6fodcfeGMSdhpRfwL4ik_U7Ohea9FqYCZZSy7necDaaZIVUyzB_JQcC1LoUfL-N7sffd-8fBPsMnS85KvnWDDmmtG2s3J-VvSA4OrZAuNxF2A_7khyXBN_RpmcxVAJR8BB5pYxp6lAeHd0vJVeHjz7LL1feXps7U4mxDgFMTAl-Zan8yykFBkZfy-U',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD7-2TpSC81XkW68SsR5qO7YCUI-agr1FkXJz6iAL2GqdUeil7o-SGTIwoV6Udw2sePVRGEriL-oq9SUQgYH-3hEcuZkF1k-3CDFq-cr9pZnDiVmYHzQPUSiyV0udgVA1j_DWyF6JsNYQjHAkNW1TvbfkMsSnfIjpYIytsbmvb-ArCRej6S77U1GKT9jkDQrHJPzf3oEUrheRg5hgvx1fyraxmtsXLolgFIgYq-RwSv0Evi8FhdOpgt5AtDXT6cBWXgqs8RTmyqT0yf',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBbPAmDMHekqLqrXZLergrySXBUGDZAJIKoEwWT1bZDzRqtg810OU5KsX8xa0w_bgyQIU4a-FSWdOAE4biaiMTeurKmzMJDdLPSSxFc_jAKcsvG44n2gEBH_EwG6oQtmdvBU_BYpG-qhla42bC3ppOILHBgUvSKvt9HCeTLNOVDMlliJFbzs15y6y0NDpMyky2-PtgjrfPcnMlT_A0EKisv2thjdd3ra_3fxCKp6EJ31D4eD_twaLrvhbkw5QN1hT3gD9nV9w4xqUiy',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDKAQ6BN0zpefAWyL1BvwOEYUEHMo8megKTLEmt-S9eb_xLkICO0VQBcPdxjmxdGWX67pZWCsubEihh4MyCwW_aCBjGPXwvOrVMtN_hdtoO3OtP8TuKjEMC4NmQcJLekA7TqDEzk0zKdmI0cWcln_TOiEWQfsOD6helF5CSyKnGrEkpzLixSICrqKjMM-IM9wmXsOXvsQ2nG37VyYlvjtWZq5Vbs3kpZlcNs_wybr-LmbxRQU9ojYeli7yk0P0adT7B7KreSF6SAEOy',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBgvVDiPytr5AGZgDZEwwSmR3CutLMkDaeDqvODNfZKhHAjqN30RAbqvGyYv2Ddf1K7hOFW8ck7KQZb0SMZpzGK9JdP9O4bSZky_-Hm8If1mGAd_t3ke4dh6QyAGJvSbuIE3E6KvrcS_GflfJjf_cDSoUg_Xs35w1LaO2RMVncewWVLNo6mKsEiv1bLbczujHaErcgcinzCspq74o89foNU-zduQpPAyFJmIiFQllEhnz0xVRV2vdQbyZmZF4HEfTM2TNB1CUQ8qqcT',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC39Rz00OUHQlENEoJpluueV1-p681BILVYn3ImGm_Pys2GQnFrWvE6k7JoE48_-SJVR-IQWsuBzseVTa3wmytgVSCAzj8Rk82xFapDFYCsJpw8_r803fBj80Dx84pd_ioNPiR1LqgQQ_wW_Hb5yewgMeb_xlKK_ASJrhCHZWwlHzvDQH0Oi8n3EL2-UYHxi6deJgoWXu2gSMXjYjG0Cc2NQCs9qug9oae_JceeOUjBarf5jOL8Ocrq8KVSXcPZ64dXclnUXT4YFdhS',
];

const normalizeInstagramHandle = (value: unknown) => {
    const cleaned = String(value || '').trim().replace(/^@+/, '').replace(/\s+/g, '');
    return cleaned || 'kinetic_riot';
};

const buildDefaultInstagramGallery = () => DEFAULT_INSTAGRAM_GALLERY_URLS.map((imageUrl, index) => ({
    id: `default-${index}`,
    imageUrl,
    username: 'kinetic_riot',
    sortOrder: index,
    isActive: true,
} satisfies SiteSettingsInstagramItem));

const mapSiteSettings = (value: unknown): SiteSettings => {
    const row = asRecord(value);
    const instagramHandle = normalizeInstagramHandle(row.instagramHandle);
    const hasGalleryField = Array.isArray(row.instagramGallery);
    const instagramRows: unknown[] = hasGalleryField
        ? (row.instagramGallery as unknown[])
        : buildDefaultInstagramGallery();
    const instagramGallery: SiteSettingsInstagramItem[] = instagramRows
        .map((entry: unknown, index: number): SiteSettingsInstagramItem | null => {
            const item = asRecord(entry);
            const imageUrl = String(item.imageUrl || '');
            if (!imageUrl) return null;

            return {
                id: String(item.id || item._id || `insta-${index}`),
                imageUrl,
                imagePublicId: item.imagePublicId ? String(item.imagePublicId) : undefined,
                username: normalizeInstagramHandle(item.username || instagramHandle),
                sortOrder: Number(item.sortOrder ?? index),
                isActive: item.isActive !== false,
            };
        })
        .filter((item): item is SiteSettingsInstagramItem => item !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
        siteName: decodeHtmlEntities(row.siteName || 'STREETRIOT'),
        navbarTitle: decodeHtmlEntities(row.navbarTitle || row.siteName || 'STREETRIOT'),
        footerTitle: decodeHtmlEntities(row.footerTitle || row.siteName || 'STREETRIOT'),
        footerDescription: decodeHtmlEntities(
            row.footerDescription ||
            'Forging the future of urban streetwear. Precision engineered, culturally driven, and globally distributed.'
        ),
        companyAddress: decodeHtmlEntities(row.companyAddress || ''),
        companyEmail: decodeHtmlEntities(row.companyEmail || ''),
        companyPhone: decodeHtmlEntities(row.companyPhone || ''),
        emailFooterDescription: decodeHtmlEntities(
            row.emailFooterDescription ||
            'This is an automated message from StreetRiot commerce engine.'
        ),
        logoUrl: decodeHtmlEntities(row.logoUrl || ''),
        logoPublicId: row.logoPublicId ? String(row.logoPublicId) : undefined,
        currencySymbol: decodeHtmlEntities(row.currencySymbol || '$'),
        instagramUrl: decodeHtmlEntities(row.instagramUrl || ''),
        instagramHandle: decodeHtmlEntities(instagramHandle),
        instagramGallery,
        twitterUrl: decodeHtmlEntities(row.twitterUrl || ''),
        youtubeUrl: decodeHtmlEntities(row.youtubeUrl || row.twitterUrl || ''),
        facebookUrl: decodeHtmlEntities(row.facebookUrl || ''),
        updatedBy: row.updatedBy ? String(row.updatedBy) : undefined,
        updatedAt: row.updatedAt ? String(row.updatedAt) : null,
    };
};

export async function fetchAdminSiteSettings(): Promise<SiteSettings> {
    const data = await request('/admin/settings');
    return mapSiteSettings(data.settings);
}

export async function fetchPublicSiteSettings(): Promise<SiteSettings> {
    const data = await request('/admin/settings/public');
    return mapSiteSettings(data.settings);
}

export async function updateAdminSiteSettings(payload: Partial<SiteSettings>) {
    const data = await request('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return mapSiteSettings(data.settings);
}

export async function uploadAdminSiteLogo(payload: { logo: File; updatedBy?: string }) {
    const form = new FormData();
    form.append('logo', payload.logo);
    if (payload.updatedBy) form.append('updatedBy', payload.updatedBy);

    const data = await request('/admin/settings/logo', {
        method: 'POST',
        body: form,
    });

    return mapSiteSettings(data.settings);
}

export async function createAdminInstagramGalleryItem(payload: {
    username: string;
    image?: File;
    imageUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
    updatedBy?: string;
}) {
    const form = new FormData();
    form.append('username', payload.username || 'kinetic_riot');
    if (typeof payload.imageUrl === 'string' && payload.imageUrl.trim()) form.append('imageUrl', payload.imageUrl.trim());
    if (payload.image) form.append('image', payload.image);
    if (typeof payload.isActive === 'boolean') form.append('isActive', String(payload.isActive));
    if (typeof payload.sortOrder === 'number' && Number.isFinite(payload.sortOrder)) form.append('sortOrder', String(payload.sortOrder));
    if (payload.updatedBy) form.append('updatedBy', payload.updatedBy);

    const data = await request('/admin/settings/instagram', {
        method: 'POST',
        body: form,
    });

    return mapSiteSettings(data.settings);
}

export async function updateAdminInstagramGalleryItem(itemId: string, payload: {
    username?: string;
    image?: File;
    imageUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
    updatedBy?: string;
}) {
    const form = new FormData();
    if (typeof payload.username === 'string') form.append('username', payload.username);
    if (typeof payload.imageUrl === 'string' && payload.imageUrl.trim()) form.append('imageUrl', payload.imageUrl.trim());
    if (payload.image) form.append('image', payload.image);
    if (typeof payload.isActive === 'boolean') form.append('isActive', String(payload.isActive));
    if (typeof payload.sortOrder === 'number' && Number.isFinite(payload.sortOrder)) form.append('sortOrder', String(payload.sortOrder));
    if (payload.updatedBy) form.append('updatedBy', payload.updatedBy);

    const data = await request(`/admin/settings/instagram/${encodeURIComponent(itemId)}`, {
        method: 'PATCH',
        body: form,
    });

    return mapSiteSettings(data.settings);
}

export async function deleteAdminInstagramGalleryItem(itemId: string, updatedBy?: string) {
    const options: RequestInit = {
        method: 'DELETE',
    };

    if (updatedBy) {
        options.body = JSON.stringify({ updatedBy });
    }

    const data = await request(`/admin/settings/instagram/${encodeURIComponent(itemId)}`, options);
    return mapSiteSettings(data.settings);
}

const mapBanner = (value: unknown): AdminBanner => {
    const row = asRecord(value);
    return {
        id: String(row.id || row._id || ''),
        title: String(row.title || ''),
        subtitle: String(row.subtitle || ''),
        imageUrl: String(row.imageUrl || ''),
        imagePublicId: row.imagePublicId ? String(row.imagePublicId) : undefined,
        targetUrl: String(row.targetUrl || ''),
        width: Number(row.width || 1200),
        height: Number(row.height || 675),
        order: Number(row.order || 0),
        isActive: row.isActive !== false,
        createdAt: row.createdAt ? String(row.createdAt) : null,
        updatedAt: row.updatedAt ? String(row.updatedAt) : null,
    };
};

const mapTestimonial = (value: unknown): AdminTestimonial => {
    const row = asRecord(value);
    return {
        id: String(row.id || row._id || ''),
        quote: String(row.quote || ''),
        name: String(row.name || ''),
        role: String(row.role || ''),
        order: Number(row.order || 0),
        isActive: row.isActive !== false,
        createdAt: row.createdAt ? String(row.createdAt) : null,
        updatedAt: row.updatedAt ? String(row.updatedAt) : null,
    };
};

export async function fetchAdminTestimonials(): Promise<AdminTestimonial[]> {
    const data = await request('/admin/testimonials');
    const rows = Array.isArray(data.testimonials) ? data.testimonials : [];
    return rows.map((entry) => mapTestimonial(entry));
}

export async function fetchAdminTestimonial(): Promise<AdminTestimonial[]> {
    return fetchAdminTestimonials();
}

export async function fetchPublicTestimonials(): Promise<AdminTestimonial[]> {
    const data = await request('/admin/testimonials/public');
    const rows = Array.isArray(data.testimonials) ? data.testimonials : [];
    return rows.map((entry) => mapTestimonial(entry));
}

export async function createAdminTestimonial(payload: {
    quote: string;
    name: string;
    role?: string;
    order?: number;
    isActive?: boolean;
}) {
    const data = await request('/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return mapTestimonial(data.testimonial);
}

export async function updateAdminTestimonial(
    id: string,
    payload: Partial<{
        quote: string;
        name: string;
        role: string;
        order: number;
        isActive: boolean;
    }>
) {
    const data = await request(`/admin/testimonials/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return mapTestimonial(data.testimonial);
}

export async function deleteAdminTestimonial(id: string) {
    return request(`/admin/testimonials/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

export async function fetchAdminBanners(): Promise<AdminBanner[]> {
    const data = await request('/admin/banners');
    const rows = Array.isArray(data.banners) ? data.banners : [];
    return rows.map((entry) => mapBanner(entry));
}

export async function fetchPublicBanners(): Promise<AdminBanner[]> {
    const data = await request('/admin/banners/public');
    const rows = Array.isArray(data.banners) ? data.banners : [];
    return rows.map((entry) => mapBanner(entry));
}

export async function createAdminBanner(payload: {
    title: string;
    subtitle: string;
    targetUrl: string;
    order?: number;
    isActive?: boolean;
    width?: number;
    height?: number;
    image?: File;
    imageUrl?: string;
}) {
    const form = new FormData();
    form.append('title', payload.title || '');
    form.append('subtitle', payload.subtitle || '');
    form.append('targetUrl', payload.targetUrl || '');
    form.append('order', String(payload.order ?? 0));
    form.append('isActive', String(payload.isActive !== false));
    form.append('width', String(payload.width ?? 1200));
    form.append('height', String(payload.height ?? 675));
    if (payload.image) form.append('image', payload.image);
    if (payload.imageUrl) form.append('imageUrl', payload.imageUrl);

    const data = await request('/admin/banners', {
        method: 'POST',
        body: form,
    });
    return mapBanner(data.banner);
}

export async function updateAdminBanner(
    id: string,
    payload: Partial<{
        title: string;
        subtitle: string;
        targetUrl: string;
        order: number;
        isActive: boolean;
        width: number;
        height: number;
        image: File;
        imageUrl: string;
    }>
) {
    const form = new FormData();
    if (payload.title !== undefined) form.append('title', String(payload.title));
    if (payload.subtitle !== undefined) form.append('subtitle', String(payload.subtitle));
    if (payload.targetUrl !== undefined) form.append('targetUrl', String(payload.targetUrl));
    if (payload.order !== undefined) form.append('order', String(payload.order));
    if (payload.isActive !== undefined) form.append('isActive', String(payload.isActive));
    if (payload.width !== undefined) form.append('width', String(payload.width));
    if (payload.height !== undefined) form.append('height', String(payload.height));
    if (payload.image) form.append('image', payload.image);
    if (payload.imageUrl) form.append('imageUrl', payload.imageUrl);

    const data = await request(`/admin/banners/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: form,
    });
    return mapBanner(data.banner);
}

export async function deleteAdminBanner(id: string) {
    return request(`/admin/banners/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}

export async function updateAdminCustomerStatus(email: string, isBlocked: boolean, blockedReason = '') {
    return request(`/admin/customers/${encodeURIComponent(email)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isBlocked, blockedReason }),
    });
}

export async function fetchAdminCustomerActivity(email: string): Promise<AdminCustomerActivity> {
    const data = await request(`/admin/customers/${encodeURIComponent(email)}/activity`);
    const payload = asRecord(data);
    return {
        customer: {
            email: String(asRecord(payload.customer).email || email),
            name: String(asRecord(payload.customer).name || ''),
            isBlocked: Boolean(asRecord(payload.customer).isBlocked),
            blockedReason: String(asRecord(payload.customer).blockedReason || ''),
            blockedAt: asRecord(payload.customer).blockedAt ? String(asRecord(payload.customer).blockedAt) : null,
        },
        summary: {
            activeSessions: Number(asRecord(payload.summary).activeSessions || 0),
            ordersCount: Number(asRecord(payload.summary).ordersCount || 0),
            totalSpent: Number(asRecord(payload.summary).totalSpent || 0),
            wishlistCount: Number(asRecord(payload.summary).wishlistCount || 0),
            recentSearches: Array.isArray(asRecord(payload.summary).recentSearches) ? (asRecord(payload.summary).recentSearches as string[]) : [],
            recentViewed: Array.isArray(asRecord(payload.summary).recentViewed) ? (asRecord(payload.summary).recentViewed as number[]) : [],
        },
        orders: Array.isArray(payload.orders) ? (payload.orders as AdminCustomerActivity['orders']) : [],
        wishlist: Array.isArray(payload.wishlist) ? (payload.wishlist as AdminCustomerActivity['wishlist']) : [],
        cartEvents: Array.isArray(payload.cartEvents) ? (payload.cartEvents as AdminCustomerActivity['cartEvents']) : [],
        timeline: Array.isArray(payload.timeline) ? (payload.timeline as AdminCustomerActivity['timeline']) : [],
    };
}

export async function fetchAdminNewsletterSubscribers(): Promise<{
    stats: { total: number; active: number };
    subscribers: NewsletterSubscriber[];
}> {
    const data = await request('/admin/communications/subscribers');
    const stats = asRecord(data.stats);
    const rows = Array.isArray(data.subscribers) ? data.subscribers : [];
    return {
        stats: {
            total: Number(stats.total || 0),
            active: Number(stats.active || 0),
        },
        subscribers: rows.map((entry) => {
            const row = asRecord(entry);
            return {
                id: String(row.id || row._id || ''),
                email: String(row.email || ''),
                source: String(row.source || 'website'),
                isActive: row.isActive !== false,
                subscribedAt: row.subscribedAt ? String(row.subscribedAt) : null,
                lastNotifiedAt: row.lastNotifiedAt ? String(row.lastNotifiedAt) : null,
                lastNotifiedType: String(row.lastNotifiedType || ''),
            } as NewsletterSubscriber;
        }),
    };
}

export async function fetchAdminContactSubmissions(status?: 'open' | 'solved'): Promise<{
    stats: { total: number; open: number; solved: number };
    contacts: ContactSubmission[];
}> {
    const path = status ? `/admin/communications/contacts?status=${encodeURIComponent(status)}` : '/admin/communications/contacts';
    const data = await request(path);
    const stats = asRecord(data.stats);
    const rows = Array.isArray(data.contacts) ? data.contacts : [];
    return {
        stats: {
            total: Number(stats.total || 0),
            open: Number(stats.open || 0),
            solved: Number(stats.solved || 0),
        },
        contacts: rows.map((entry) => {
            const row = asRecord(entry);
            return {
                id: String(row.id || row._id || ''),
                ticketCode: String(row.ticketCode || ''),
                name: String(row.name || ''),
                email: String(row.email || ''),
                department: String(row.department || 'GENERAL INQUIRY'),
                message: String(row.message || ''),
                status: String(row.status || 'open') === 'solved' ? 'solved' : 'open',
                solvedAt: row.solvedAt ? String(row.solvedAt) : null,
                solvedBy: String(row.solvedBy || ''),
                resolutionMessage: String(row.resolutionMessage || ''),
                createdAt: row.createdAt ? String(row.createdAt) : null,
                updatedAt: row.updatedAt ? String(row.updatedAt) : null,
            } as ContactSubmission;
        }),
    };
}

export async function fetchAdminProductNotifyRequests(status?: 'pending' | 'notified'): Promise<{
    stats: { total: number; pending: number; notified: number };
    requests: ProductNotifyRequest[];
}> {
    const path = status
        ? `/admin/communications/product-notify?status=${encodeURIComponent(status)}`
        : '/admin/communications/product-notify';
    const data = await request(path);
    const stats = asRecord(data.stats);
    const rows = Array.isArray(data.requests) ? data.requests : [];
    return {
        stats: {
            total: Number(stats.total || 0),
            pending: Number(stats.pending || 0),
            notified: Number(stats.notified || 0),
        },
        requests: rows.map((entry) => {
            const row = asRecord(entry);
            return {
                id: String(row.id || row._id || ''),
                email: String(row.email || ''),
                product_id: Number(row.product_id || 0),
                product_name: String(row.product_name || ''),
                color: typeof row.color === 'string' ? row.color : undefined,
                size: typeof row.size === 'string' ? row.size : undefined,
                source: String(row.source || 'product_detail'),
                status: String(row.status || 'pending') === 'notified' ? 'notified' : 'pending',
                isActive: row.isActive !== false,
                requestedAt: row.requestedAt ? String(row.requestedAt) : null,
                notifiedAt: row.notifiedAt ? String(row.notifiedAt) : null,
                updatedAt: row.updatedAt ? String(row.updatedAt) : null,
            } as ProductNotifyRequest;
        }),
    };
}

export async function updateAdminProductNotifyRequest(
    id: string,
    payload: { status?: 'pending' | 'notified'; isActive?: boolean }
): Promise<ProductNotifyRequest | null> {
    const data = await request(`/admin/communications/product-notify/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload || {}),
    });
    const row = asRecord(data.request);
    if (!row || !row.id) return null;
    return {
        id: String(row.id || row._id || ''),
        email: String(row.email || ''),
        product_id: Number(row.product_id || 0),
        product_name: String(row.product_name || ''),
        color: typeof row.color === 'string' ? row.color : undefined,
        size: typeof row.size === 'string' ? row.size : undefined,
        source: String(row.source || 'product_detail'),
        status: String(row.status || 'pending') === 'notified' ? 'notified' : 'pending',
        isActive: row.isActive !== false,
        requestedAt: row.requestedAt ? String(row.requestedAt) : null,
        notifiedAt: row.notifiedAt ? String(row.notifiedAt) : null,
        updatedAt: row.updatedAt ? String(row.updatedAt) : null,
    } as ProductNotifyRequest;
}

export async function fetchAdminReviews(): Promise<{
    stats: { totalReviews: number; totalUsers: number; totalProducts: number };
    reviews: AdminReview[];
}> {
    const data = await request('/admin/reviews');
    const stats = asRecord(data.stats);
    const rows = Array.isArray(data.reviews) ? data.reviews : [];

    const mapProduct = (value: unknown): AdminReviewProductMeta => {
        const row = asRecord(value);
        return {
            product_id: Number(row.product_id || 0),
            product_code: String(row.product_code || ''),
            product_name: String(row.product_name || ''),
            product_image: String(row.product_image || ''),
        };
    };

    return {
        stats: {
            totalReviews: Number(stats.totalReviews || 0),
            totalUsers: Number(stats.totalUsers || 0),
            totalProducts: Number(stats.totalProducts || 0),
        },
        reviews: rows.map((entry) => {
            const row = asRecord(entry);
            const userStats = asRecord(row.user_stats);
            return {
                id: String(row.id || row._id || ''),
                product_id: Number(row.product_id || 0),
                product: mapProduct(row.product),
                review_rate: Number(row.review_rate || 0),
                review_text: String(row.review_text || ''),
                review_title: String(row.review_title || ''),
                review_image: String(row.review_image || ''),
                review_images: Array.isArray(row.review_images)
                    ? row.review_images.map((item) => String(item || '')).filter(Boolean)
                    : [],
                user_name: String(row.user_name || 'Anonymous'),
                createdAt: row.createdAt ? String(row.createdAt) : null,
                user_stats: {
                    totalReviews: Number(userStats.totalReviews || 0),
                    reviewedProducts: Array.isArray(userStats.reviewedProducts)
                        ? userStats.reviewedProducts.map((item) => mapProduct(item))
                        : [],
                },
            } as AdminReview;
        }),
    };
}

export async function deleteAdminReview(reviewId: string) {
    return request(`/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
    });
}

export async function markAdminContactSolved(contactId: string, payload: { solvedBy?: string; resolutionMessage?: string }) {
    return request(`/admin/communications/contacts/${encodeURIComponent(contactId)}/solve`, {
        method: 'PATCH',
        body: JSON.stringify(payload || {}),
    });
}

export async function submitProductReview(payload: {
    productId: number;
    rating: number;
    text: string;
    title?: string;
    userName: string;
    email?: string;
    images?: File[];
    image?: File;
}) {
    const bases = getBackendBaseUrlCandidates();
    const form = new FormData();
    form.append('product_id', String(payload.productId));
    form.append('review_rate', String(payload.rating));
    form.append('review_text', payload.text);
    form.append('review_title', payload.title || '');
    form.append('user_name', payload.userName || 'Anonymous');
    form.append('email', payload.email || getUserEmail() || 'guest@streetriot.com');
    const files = Array.isArray(payload.images)
        ? payload.images.slice(0, 2)
        : payload.image
            ? [payload.image]
            : [];
    files.forEach((file) => {
        form.append('reviewImages', file);
    });

    let response: Response | null = null;
    for (const base of bases) {
        try {
            response = await fetch(`${base}/user/product-reviews`, {
                method: 'POST',
                body: form,
                cache: 'no-store',
            });
            break;
        } catch {
            response = null;
        }
    }

    if (!response) {
        throw new Error('Failed to submit review. Backend unreachable.');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((asRecord(data).message as string) || 'Failed to submit review');
    return asRecord(data);
}

export async function fetchProductReviews(productId: number) {
    const data = await request(`/user/get-product-reviews/${productId}`);
    return Array.isArray(data.reviews) ? data.reviews : [];
}
