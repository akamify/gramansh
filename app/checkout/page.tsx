"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";
import {
  fetchUserAddresses,
  createUserAddress,
  updateUserAddress,
  createBackendOrder,
  verifyBackendPayment,
  sendOtp,
  type UserAddress,
  type UserAddressInput,
} from "@/app/lib/apiClient";
import AddressCard from "@/app/components/address/AddressCard";
import AddressForm from "@/app/components/address/AddressForm";
import AddressModal from "@/app/components/address/AddressModal";
import ResilientProductImage from "@/app/components/ResilientProductImage";
import {
  fetchBackendProductById,
  matchVariantByCartSize,
} from "@/app/lib/backendProducts";
import { createProductHref, getProductImageSources } from "@/app/data/products";
import CheckoutEmailOtpModal from "./components/CheckoutEmailOtpModal";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}


const SHIPPING = 0;
const SELECTED_ADDRESS_STORAGE_KEY = "checkout:selected-address-id";
const checkoutItemKey = (id: number, size: string) =>
  `${id}-${String(size || "")
    .trim()
    .toLowerCase()}`;
const COD_CHARGE = (() => {
  const parsed = Number(
    String(process.env.NEXT_PUBLIC_COD_CHARGE || "").trim(),
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
})();

const createEmptyAddress = (): UserAddressInput => ({
  FullName: "",
  phone1: "",
  phone2: "",
  address: "",
  address_line2: "",
  city: "",
  state: "",
  district: "",
  pinCode: "",
  country: "India",
  addressType: "Home",
});

function CheckoutAddressSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#e1e8dd] bg-white p-5 shadow-[0_16px_50px_rgba(27,67,24,0.06)] sm:p-6">
      <div className="h-7 w-48 animate-pulse rounded-full bg-[#eaf0e8]" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-[#f1f5ef]"
          />
        ))}
      </div>
      <div className="mt-4 h-14 animate-pulse rounded-2xl bg-[#eef5ec]" />
    </div>
  );
}

function CheckoutSummarySkeleton() {
  return (
    <div className="rounded-[1.75rem] border border-[#dce7d8] bg-white p-5 shadow-[0_20px_60px_rgba(27,67,24,0.10)] sm:p-6">
      <div className="h-7 w-40 animate-pulse rounded-full bg-[#eaf0e8]" />
      <div className="mt-6 space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-[#f1f5ef]" />
        <div className="h-20 animate-pulse rounded-2xl bg-[#f1f5ef]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#f1f5ef]" />
      </div>
      <div className="mt-5 h-14 animate-pulse rounded-2xl bg-[#e7f4e4]" />
    </div>
  );
}

type BuyNowItem = {
  id: number;
  name: string;
  price: number;
  color: string;
  size: string;
  image: string;
  collection: string;
  qty: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, clearCart, isHydrating } = useCart();
  const {
    isAuthenticated,
    user,
    isLoading: isAuthLoading,
    completeEmailOtpLogin,
  } = useAuth();
  const { settings, isLoading: isSettingsLoading } = useSiteSettings();
  const currencySymbol = settings.currencySymbol || "Rs.";

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Razorpay" | "COD">(
    "Razorpay",
  );
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState("");
  const [newAddress, setNewAddress] =
    useState<UserAddressInput>(createEmptyAddress());
  const [guestEmail, setGuestEmail] = useState("");
  const [guestAddressReady, setGuestAddressReady] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [checkoutOtp, setCheckoutOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isOtpBusy, setIsOtpBusy] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [hasStockConflict, setHasStockConflict] = useState(false);
  const [stockConflictMessage, setStockConflictMessage] = useState("");
  const [codUnavailableNames, setCodUnavailableNames] = useState<string[]>([]);
  const [hasCheckedCodAvailability, setHasCheckedCodAvailability] =
    useState(false);
  const [checkoutImageSources, setCheckoutImageSources] = useState<
    Record<string, string[]>
  >({});
  const [checkoutProductHrefs, setCheckoutProductHrefs] = useState<
    Record<string, string>
  >({});

  const checkoutItems = useMemo(
    () => (buyNowItem ? [buyNowItem] : items),
    [buyNowItem, items],
  );
  const checkoutItemCount = buyNowItem ? buyNowItem.qty : itemCount;
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const codCharge = paymentMethod === "COD" ? COD_CHARGE : 0;
  const total = subtotal + SHIPPING + codCharge;
  const isPageLoading = isHydrating || isAuthLoading || isSettingsLoading;
  const isCodAvailableForCheckout =
    checkoutItems.length > 0 &&
    hasCheckedCodAvailability &&
    codUnavailableNames.length === 0;
  const guestCheckoutEmail = guestEmail.trim().toLowerCase();
  const needsGuestOtpVerification = !isAuthenticated && paymentMethod === "COD";
  const codUnavailableMessage = codUnavailableNames.length
    ? `COD is not available for ${codUnavailableNames.slice(0, 2).join(", ")}${codUnavailableNames.length > 2 ? " and more" : ""}.`
    : "";

  useEffect(() => {
    const saved = window.localStorage.getItem("sr_buy_now_item");
    if (!saved) return;
    try {
      setBuyNowItem(JSON.parse(saved));
    } catch {
      window.localStorage.removeItem("sr_buy_now_item");
    }
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    script.onerror = () =>
      setPaymentError(
        "Unable to load secure payment checkout. Please refresh and try again.",
      );
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const validateCheckoutStock = async () => {
      if (!checkoutItems.length) {
        if (!cancelled) {
          setHasStockConflict(false);
          setStockConflictMessage("");
          setCodUnavailableNames([]);
          setHasCheckedCodAvailability(true);
          setCheckoutImageSources({});
          setCheckoutProductHrefs({});
        }
        return;
      }
      setHasCheckedCodAvailability(false);
      try {
        const ids = [
          ...new Set(
            checkoutItems.map((item) => Number(item.id)).filter(Boolean),
          ),
        ];
        const products = await Promise.all(
          ids.map((id) => fetchBackendProductById(id)),
        );
        if (cancelled) return;
        const productMap = new Map(
          products.filter(Boolean).map((product) => [product!.id, product!]),
        );
        const images: Record<string, string[]> = {};
        const hrefs: Record<string, string> = {};
        const codBlocked: string[] = [];
        let conflictMessage = "";

        for (const item of checkoutItems) {
          const product = productMap.get(item.id);
          const key = checkoutItemKey(item.id, item.size);
          if (!product) {
            conflictMessage =
              "Some items are unavailable. Please review your cart.";
            break;
          }
          images[key] = Array.from(
            new Set(
              [
                ...getProductImageSources(product, item.size),
                item.image,
              ].filter(Boolean),
            ),
          );
          hrefs[key] = createProductHref(product, item.size);
          if (product.codAvailable !== true)
            codBlocked.push(product.name || item.name || `Product ${item.id}`);
          const variant = matchVariantByCartSize(product, item.size);
          const available = variant
            ? Math.max(0, Number(variant.stock || 0))
            : Math.max(0, Number(product.quantity || 0));
          if (available < Number(item.qty || 0)) {
            conflictMessage =
              "Some items are out of stock. Please update your cart before checkout.";
            break;
          }
        }
        setHasStockConflict(Boolean(conflictMessage));
        setStockConflictMessage(conflictMessage);
        setCodUnavailableNames(codBlocked);
        setCheckoutImageSources(images);
        setCheckoutProductHrefs(hrefs);
        setHasCheckedCodAvailability(true);
      } catch {
        if (cancelled) return;
        setHasStockConflict(false);
        setStockConflictMessage("");
        setCodUnavailableNames([]);
        setHasCheckedCodAvailability(true);
        setCheckoutImageSources(
          Object.fromEntries(
            checkoutItems.map((item) => [
              checkoutItemKey(item.id, item.size),
              [item.image].filter(Boolean),
            ]),
          ),
        );
        setCheckoutProductHrefs({});
      }
    };
    void validateCheckoutStock();
    return () => {
      cancelled = true;
    };
  }, [checkoutItems]);

  useEffect(() => {
    if (paymentMethod === "COD" && !isCodAvailableForCheckout)
      setPaymentMethod("Razorpay");
  }, [isCodAvailableForCheckout, paymentMethod]);

  const persistSelectedAddressId = (value: number | null) => {
    if (!value) window.sessionStorage.removeItem(SELECTED_ADDRESS_STORAGE_KEY);
    else
      window.sessionStorage.setItem(
        SELECTED_ADDRESS_STORAGE_KEY,
        String(value),
      );
  };

  const syncSelectedAddress = (rows: UserAddress[]) => {
    if (!rows.length) {
      setSelectedAddressId(null);
      persistSelectedAddressId(null);
      return;
    }
    const saved = Number(
      window.sessionStorage.getItem(SELECTED_ADDRESS_STORAGE_KEY) || 0,
    );
    const nextId =
      Number.isInteger(saved) && rows.some((row) => row.address_id === saved)
        ? saved
        : rows[0].address_id;
    setSelectedAddressId(nextId);
    persistSelectedAddressId(nextId);
  };

  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated) {
        setIsLoadingAddresses(false);
        return;
      }
      setIsLoadingAddresses(true);
      try {
        const data = await fetchUserAddresses();
        setAddresses(data);
        syncSelectedAddress(data);
      } catch {
        setAddresses([]);
        setSelectedAddressId(null);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    void loadAddresses();
  }, [isAuthenticated]);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const validateAddressFields = (address: UserAddressInput) => {
    if (
      !address.FullName ||
      !address.phone1 ||
      !address.address ||
      !address.city ||
      !address.pinCode
    )
      return "Please fill all required address fields.";
    return "";
  };
  const validateGuestCheckout = () =>
    isValidEmail(guestEmail)
      ? validateAddressFields(newAddress)
      : "Please enter a valid email address.";
  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressError("");
    setNewAddress(createEmptyAddress());
  };

  const openEditAddress = (address: UserAddress) => {
    setEditingAddressId(address.address_id);
    setAddressError("");
    setNewAddress({
      FullName: address.FullName || "",
      phone1: address.phone1 || "",
      phone2: address.phone2 || "",
      address: address.address || "",
      address_line2: address.address_line2 || "",
      city: address.city || "",
      state: address.state || "",
      district: address.district || "",
      pinCode: address.pinCode || "",
      country: address.country || "India",
      addressType: address.addressType || "Home",
    });
    setShowAddAddress(true);
  };

  const handleAddressSubmit = async () => {
    const message = validateAddressFields(newAddress);
    if (message) {
      setAddressError(message);
      return;
    }
    if (!isAuthenticated) {
      if (!isValidEmail(guestEmail)) {
        setAddressError("Please enter a valid email address.");
        return;
      }
      setAddressError("");
      setGuestAddressReady(true);
      setCheckoutNotice("Address is ready. Continue to complete checkout.");
      return;
    }
    try {
      setAddressError("");
      if (editingAddressId) {
        const updated = await updateUserAddress(editingAddressId, newAddress);
        setAddresses((current) =>
          current.map((item) =>
            item.address_id === editingAddressId ? updated : item,
          ),
        );
        setSelectedAddressId(updated.address_id);
        persistSelectedAddressId(updated.address_id);
      } else {
        const created = await createUserAddress(newAddress);
        setAddresses((current) => [...current, created]);
        setSelectedAddressId(created.address_id);
        persistSelectedAddressId(created.address_id);
      }
      setShowAddAddress(false);
      resetAddressForm();
    } catch {
      setAddressError("Failed to save address. Please try again.");
    }
  };

  const startGuestEmailVerification = async () => {
    const message = validateGuestCheckout();
    if (message) {
      setAddressError(message);
      setPaymentError(message);
      return;
    }
    const email = guestEmail.trim().toLowerCase();
    setIsOtpBusy(true);
    setPaymentError("");
    setOtpError("");
    try {
      await sendOtp(email);
      setOtpEmail(email);
      setCheckoutOtp("");
      setIsOtpModalOpen(true);
      setGuestAddressReady(true);
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Failed to send OTP. Please try again.",
      );
    } finally {
      setIsOtpBusy(false);
    }
  };

  const verifyGuestOtpAndCreateSession = async () => {
    if (checkoutOtp.length !== 6 || !otpEmail) return;
    setIsOtpBusy(true);
    setOtpError("");
    try {
      await completeEmailOtpLogin(otpEmail, checkoutOtp);
      const created = await createUserAddress(newAddress);
      setAddresses([created]);
      setSelectedAddressId(created.address_id);
      persistSelectedAddressId(created.address_id);
      setGuestEmail(otpEmail);
      setGuestAddressReady(true);
      setIsOtpModalOpen(false);
      setCheckoutOtp("");
      setCheckoutNotice(
        "Email verified successfully. Your address has been saved.",
      );
      setPaymentError("");
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : "OTP verification failed. Please try again.",
      );
    } finally {
      setIsOtpBusy(false);
    }
  };

  const ensureGuestAddressForPrepaid = async () => {
    const message = validateGuestCheckout();
    if (message) {
      setAddressError(message);
      setPaymentError(message);
      return null;
    }
    const existing = addresses.find(
      (address) => address.address_id === selectedAddressId,
    );
    if (existing) return existing;
    try {
      const created = await createUserAddress(newAddress, guestCheckoutEmail);
      setAddresses([created]);
      setSelectedAddressId(created.address_id);
      persistSelectedAddressId(created.address_id);
      setGuestAddressReady(true);
      setAddressError("");
      return created;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save address.";
      setAddressError(errorMessage);
      setPaymentError(errorMessage);
      return null;
    }
  };

  const handlePayment = async () => {
    if (!checkoutItemCount || isProcessing || isOtpBusy) return;
    if (hasStockConflict) {
      setPaymentError(stockConflictMessage || "Some items are out of stock.");
      return;
    }
    if (paymentMethod === "COD" && !isCodAvailableForCheckout) {
      setPaymentError(
        codUnavailableMessage ||
          "COD is not available for one or more products.",
      );
      return;
    }
    if (!isAuthenticated && paymentMethod === "COD") {
      await startGuestEmailVerification();
      return;
    }
    if (
      paymentMethod === "Razorpay" &&
      (!isRazorpayLoaded || !window.Razorpay)
    ) {
      setPaymentError(
        "Secure payment is loading. Please wait a moment and try again.",
      );
      return;
    }

    let effectiveAddressId = selectedAddressId;
    let effectiveAddress =
      addresses.find((address) => address.address_id === selectedAddressId) ||
      null;
    const effectiveEmail = isAuthenticated
      ? user?.email || guestCheckoutEmail
      : guestCheckoutEmail;
    if (!isAuthenticated) {
      const savedAddress = await ensureGuestAddressForPrepaid();
      if (!savedAddress) return;
      effectiveAddressId = savedAddress.address_id;
      effectiveAddress = savedAddress;
    }
    if (!effectiveAddressId) {
      setPaymentError("Please select a delivery address.");
      return;
    }
    setIsProcessing(true);
    setPaymentError("");
    try {
      const orderData = (await createBackendOrder(
        checkoutItems.map((item) => ({
          product_id: item.id,
          quantity: item.qty,
          size: item.size,
          color: item.color || "",
          price: item.price,
        })),
        effectiveAddressId,
        undefined,
        paymentMethod,
        effectiveEmail,
      )) as Record<string, unknown>;
      if (paymentMethod === "COD") {
        window.localStorage.removeItem("sr_buy_now_item");
        if (!buyNowItem) clearCart();
        router.push(
          `/order/success?order_id=${encodeURIComponent(String(orderData.order_id || orderData.local_order_id || ""))}`,
        );
        return;
      }
      const orderId = (orderData.order as Record<string, unknown> | undefined)
        ?.id as string | undefined;
      const localOrderId = String(orderData.local_order_id || "");
      const key = String(orderData.key || "");
      if (!orderId || !key || !window.Razorpay)
        throw new Error("Razorpay is not configured yet.");
      const razorpay = new window.Razorpay({
        key,
        amount: Number(orderData.amount || Math.round(total * 100)),
        currency: String(orderData.currency || "INR"),
        name: settings.siteName || "Gram Ansh",
        description: `${checkoutItemCount} item${checkoutItemCount > 1 ? "s" : ""}`,
        order_id: orderId,
        prefill: {
          name: effectiveAddress?.FullName || "",
          email: effectiveEmail,
          contact: effectiveAddress?.phone1 || "",
        },
        theme: { color: "#1d641a" },
        handler: async (response: Record<string, unknown>) => {
          try {
            const verified = (await verifyBackendPayment({
              razorpay_order_id: String(response.razorpay_order_id || ""),
              razorpay_payment_id: String(response.razorpay_payment_id || ""),
              razorpay_signature: String(response.razorpay_signature || ""),
              items: checkoutItems.map((item) => ({
                product_id: item.id,
                quantity: item.qty,
                size: item.size,
                color: item.color || "",
                price: item.price,
              })),
              address_id: effectiveAddressId || undefined,
              email: effectiveEmail,
            })) as Record<string, unknown>;
            if (verified.status) {
              window.localStorage.removeItem("sr_buy_now_item");
              if (!buyNowItem) clearCart();
              router.push(
                `/order/success?order_id=${encodeURIComponent(String(verified.order_id || localOrderId))}`,
              );
            } else
              router.push(
                `/order/failed?error=${encodeURIComponent(String(verified.message || "Payment verification failed"))}`,
              );
          } catch {
            router.push(
              `/order/failed?error=${encodeURIComponent("Payment verification failed")}`,
            );
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
      });
      razorpay.open();
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Payment could not be started. Please try again.",
      );
      setIsProcessing(false);
    }
  };

  const paymentButtonText = isProcessing
    ? "Processing your order..."
    : isOtpBusy && needsGuestOtpVerification
      ? "Sending verification code..."
      : needsGuestOtpVerification
        ? "Verify email to order"
        : paymentMethod === "COD"
          ? "Place Cash on Delivery order"
          : `Pay ${currencySymbol}${total.toFixed(2)}`;
  const paymentButtonIcon = isProcessing
    ? "progress_activity"
    : needsGuestOtpVerification
      ? "mark_email_unread"
      : paymentMethod === "COD"
        ? "shopping_bag"
        : "lock";
  const mobilePaymentButtonText = isProcessing
    ? "Processing..."
    : isOtpBusy && needsGuestOtpVerification
      ? "Sending OTP..."
      : needsGuestOtpVerification
        ? "Verify email"
        : paymentMethod === "COD"
          ? "Place order"
          : "Pay now";
  const paymentDisabled =
    isProcessing ||
    isOtpBusy ||
    hasStockConflict ||
    (isAuthenticated && !selectedAddressId);

  if (!isPageLoading && !checkoutItemCount) {
    return (
      <main className="min-h-screen bg-[#f7f8f3] px-4 pb-10 pt-10 sm:px-6">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-[#e7eadf] bg-white p-8 text-center shadow-[0_20px_70px_rgba(29,66,26,0.08)] sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eef7ec] text-[#276221]">
              <span className="material-symbols-outlined text-4xl">
                shopping_cart
              </span>
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#699064]">
              Nothing to checkout
            </p>
            <h1 className="mt-3 font-headline text-3xl font-black tracking-tight text-[#173f19] sm:text-4xl">
              Your cart is empty
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6a7467]">
              {buyNowItem
                ? "This Buy Now item is no longer available. Please select it again."
                : "Add products to your cart before moving to checkout."}
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1f641d] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1f641d]/20 transition hover:-translate-y-0.5 hover:bg-[#174e16]"
            >
              Continue shopping{" "}
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] pb-28 pt-10 sm:pt-12 lg:pb-8">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-10">
        <header className="mb-4 overflow-hidden rounded-[1.5rem] border border-[#e3eadf] bg-white shadow-[0_16px_45px_rgba(27,67,24,0.06)] sm:mb-5 sm:rounded-[1.75rem]">
          <div className="flex flex-col gap-3 px-4 py-4 sm:px-7 sm:py-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf6e8] text-[#1d641a] sm:h-12 sm:w-12 sm:rounded-2xl">
                <span className="material-symbols-outlined text-[26px]">
                  lock
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-headline text-[1.45rem] font-black tracking-tight text-[#173f19] sm:text-3xl">
                    Secure Checkout
                  </h1>
                  <span className="hidden rounded-full bg-[#eaf6e8] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#267321] sm:inline-block">
                    Protected
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#5f6c5d] sm:mt-1 sm:text-sm">
                  Confirm delivery details and complete your order.
                </p>
              </div>
            </div>
            <Link
              href="/cart"
              className="inline-flex w-fit items-center gap-2 self-start rounded-xl border border-[#dfe7db] bg-[#fbfdf9] px-3.5 py-2 text-sm font-bold text-[#245b20] transition hover:border-[#9fc798] hover:bg-[#f1f9ef] md:self-auto"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              Back to cart
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-[#edf0e9] bg-[#fbfcfa] px-4 py-2.5 text-center sm:px-5 sm:py-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#1d641a]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1d641a] text-[11px] text-white">
                1
              </span>
              <span className="hidden sm:inline">Address</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#789076]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8eee6] text-[11px] text-[#63805e]">
                2
              </span>
              <span className="hidden sm:inline">Payment</span>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_410px] xl:gap-8">
          <section className="min-w-0">
            {isPageLoading ? (
              <CheckoutAddressSkeleton />
            ) : !isAuthenticated ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-[#e1e8dd] bg-white shadow-[0_16px_50px_rgba(27,67,24,0.06)]">
                <div className="border-b border-[#edf0e9] bg-[linear-gradient(135deg,#f6fcf4,#eef8eb)] px-4 py-4 sm:px-7 sm:py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dff2da] text-[#23651d]">
                      <span className="material-symbols-outlined">
                        local_shipping
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline text-xl font-black text-[#173f19]">
                        Delivery details
                      </h2>
                      <p className="mt-1 text-sm text-[#6b7569]">
                        Enter your email and delivery address to continue.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="mb-4 rounded-2xl border border-[#dce9d7] bg-[#fbfef9] p-4">
                    <label className="block">
                      <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#557851]">
                        <span className="material-symbols-outlined text-base">
                          mail
                        </span>
                        {needsGuestOtpVerification
                          ? "Email verification required"
                          : "Email for order updates"}
                      </span>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(event) => {
                          setGuestEmail(event.target.value);
                          setCheckoutNotice("");
                        }}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-[#d5e0d0] bg-white px-4 py-3 text-base text-[#293729] outline-none transition placeholder:text-[#6f786d] focus:border-[#2d7727] focus:ring-4 focus:ring-[#2d7727]/10 sm:text-sm"
                      />
                    </label>
                    <div className="mt-3 flex gap-2 rounded-xl bg-[#f1f8ef] px-3 py-2.5 text-xs leading-5 text-[#557151]">
                      <span className="material-symbols-outlined mt-0.5 text-base text-[#297324]">
                        info
                      </span>
                      <p>
                        {needsGuestOtpVerification
                          ? "For Cash on Delivery, we will verify this email with a one-time OTP."
                          : "We will send payment confirmation and order updates to this email."}
                      </p>
                    </div>
                  </div>
                  <AddressForm
                    value={newAddress}
                    busy={isOtpBusy}
                    onChange={(next) => {
                      setNewAddress(next);
                      setGuestAddressReady(false);
                      setCheckoutNotice("");
                    }}
                    onSubmit={handleAddressSubmit}
                    submitLabel={
                      guestAddressReady
                        ? "Address saved for checkout"
                        : "Use this address"
                    }
                    error={addressError}
                  />
                  {checkoutNotice ? (
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#bfe4b8] bg-[#effbea] px-4 py-3 text-sm font-semibold text-[#276d23]">
                      <span className="material-symbols-outlined text-lg">
                        check_circle
                      </span>
                      {checkoutNotice}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : isLoadingAddresses ? (
              <CheckoutAddressSkeleton />
            ) : (
              <div className="overflow-hidden rounded-[1.75rem] border border-[#e1e8dd] bg-white shadow-[0_16px_50px_rgba(27,67,24,0.06)]">
                <div className="flex flex-col gap-4 border-b border-[#edf0e9] bg-[linear-gradient(135deg,#f7fcf5,#edf8e9)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ddf1d8] text-[#23651d]">
                      <span className="material-symbols-outlined">
                        location_on
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline text-xl font-black text-[#173f19]">
                        Delivery address
                      </h2>
                      <p className="mt-1 text-sm text-[#6b7569]">
                        Choose where you want your order delivered.
                      </p>
                    </div>
                  </div>
                  {addresses.length > 0 ? (
                    <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#52764e] shadow-sm">
                      {addresses.length} saved{" "}
                      {addresses.length === 1 ? "address" : "addresses"}
                    </span>
                  ) : null}
                </div>
                <div className="p-4 sm:p-6">
                  {addresses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#cbdcc7] bg-[#fbfdf9] px-5 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf6eb] text-[#397633]">
                        <span className="material-symbols-outlined">
                          location_off
                        </span>
                      </div>
                      <p className="mt-4 font-bold text-[#244a23]">
                        No address saved yet
                      </p>
                      <p className="mt-1 text-sm text-[#758174]">
                        Add a delivery address to place your order.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="grid max-h-[440px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2"
                      data-lenis-prevent="true"
                      onWheel={(event) => event.stopPropagation()}
                      onTouchMove={(event) => event.stopPropagation()}
                    >
                      {addresses.map((address) => (
                        <div
                          key={address.address_id}
                          className={`relative overflow-hidden rounded-2xl transition ${selectedAddressId === address.address_id ? "ring-2 ring-[#2a7825] ring-offset-2" : ""}`}
                        >
                          <AddressCard
                            address={address}
                            selected={selectedAddressId === address.address_id}
                            onSelect={() => {
                              setSelectedAddressId(address.address_id);
                              persistSelectedAddressId(address.address_id);
                            }}
                            onEdit={() => openEditAddress(address)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      resetAddressForm();
                      setShowAddAddress(true);
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#b9d3b4] bg-[#fbfef9] px-4 py-3.5 text-sm font-bold text-[#276e22] transition hover:border-[#2a7825] hover:bg-[#f1faef]"
                  >
                    <span className="material-symbols-outlined">
                      add_circle
                    </span>
                    Add a new address
                  </button>
                  {addressError ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                      {addressError}
                    </p>
                  ) : null}
                </div>
                {showAddAddress ? (
                  <AddressModal
                    title={
                      editingAddressId
                        ? "Edit delivery address"
                        : "Add delivery address"
                    }
                    onClose={() => {
                      setShowAddAddress(false);
                      resetAddressForm();
                    }}
                  >
                    <AddressForm
                      value={newAddress}
                      onChange={setNewAddress}
                      onSubmit={handleAddressSubmit}
                      onCancel={() => {
                        setShowAddAddress(false);
                        resetAddressForm();
                      }}
                      submitLabel={
                        editingAddressId ? "Update address" : "Save address"
                      }
                      error={addressError}
                    />
                  </AddressModal>
                ) : null}
              </div>
            )}
            <div className="mt-5 flex items-center justify-center gap-5 text-xs font-semibold text-[#738070] sm:justify-start">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#398035]">
                  verified_user
                </span>
                Secure payment
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#398035]">
                  local_shipping
                </span>
                Safe delivery
              </span>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24">
            {isPageLoading ? (
              <CheckoutSummarySkeleton />
            ) : (
              <div className="overflow-hidden rounded-[1.75rem] border border-[#dce7d8] bg-white shadow-[0_20px_60px_rgba(27,67,24,0.10)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#ebf0e8] bg-[#fbfdf9] px-4 py-4 sm:px-6 sm:py-5">
                  <div>
                    <h2 className="font-headline text-xl font-black text-[#173f19]">
                      Order summary
                    </h2>
                    <p className="mt-1 text-sm text-[#738070]">
                      {checkoutItemCount}{" "}
                      {checkoutItemCount === 1 ? "item" : "items"} in your order
                    </p>
                  </div>
                  <Link
                    href="/cart"
                    className="rounded-xl bg-[#eef7eb] px-3 py-2 text-xs font-bold text-[#286d23] transition hover:bg-[#e0f2db]"
                  >
                    Edit cart
                  </Link>
                </div>
                <div
                  className="max-h-[245px] space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
                  data-lenis-prevent="true"
                  onWheel={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                >
                  {checkoutItems.map((item) => {
                    const key = checkoutItemKey(item.id, item.size);
                    const href = checkoutProductHrefs[key];
                    const image = (
                      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-[#edf0e9] bg-[#f4f6f1]">
                        <ResilientProductImage
                          sources={checkoutImageSources[key] || [item.image]}
                          alt={item.name}
                          compact
                        />
                      </div>
                    );
                    return (
                      <div
                        key={key}
                        className="flex gap-3 rounded-2xl border border-[#edf0e9] bg-[#fcfdfb] p-3"
                      >
                        {href ? <Link href={href}>{image}</Link> : image}
                        <div className="min-w-0 flex-1">
                          {href ? (
                            <Link
                              href={href}
                              className="line-clamp-2 text-sm font-bold leading-5 text-[#244a23] transition hover:text-[#327c2b]"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <p className="line-clamp-2 text-sm font-bold leading-5 text-[#244a23]">
                              {item.name}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs text-[#778274]">
                              {item.size ? `Size: ${item.size} · ` : ""}Qty:{" "}
                              {item.qty}
                            </span>
                            <span className="shrink-0 text-sm font-extrabold text-[#1f641d]">
                              {currencySymbol}
                              {(item.price * item.qty).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-[#edf0e9] px-4 py-4 sm:px-6 sm:py-5">
                  <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#71846e]">
                    Select payment method
                  </p>
                  <div
                    className={`grid gap-2 ${isCodAvailableForCheckout ? "grid-cols-2" : "grid-cols-1"}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentError("");
                        setPaymentMethod("Razorpay");
                      }}
                      className={`rounded-2xl border p-3 text-left transition ${paymentMethod === "Razorpay" ? "border-[#2c7b26] bg-[#eff9ed] ring-1 ring-[#2c7b26]" : "border-[#dfe8dc] bg-white hover:border-[#a8cda2]"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`material-symbols-outlined ${paymentMethod === "Razorpay" ? "text-[#267621]" : "text-[#849582]"}`}
                        >
                          credit_card
                        </span>
                        <span className="text-sm font-extrabold text-[#244a23]">
                          Prepaid
                        </span>
                      </div>
                      <p className="mt-1 pl-8 text-[11px] text-[#748172]">
                        UPI, card, net banking
                      </p>
                    </button>
                    {isCodAvailableForCheckout ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentError("");
                          setPaymentMethod("COD");
                        }}
                        className={`rounded-2xl border p-3 text-left transition ${paymentMethod === "COD" ? "border-[#2c7b26] bg-[#eff9ed] ring-1 ring-[#2c7b26]" : "border-[#dfe8dc] bg-white hover:border-[#a8cda2]"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined ${paymentMethod === "COD" ? "text-[#267621]" : "text-[#849582]"}`}
                          >
                            payments
                          </span>
                          <span className="text-sm font-extrabold text-[#244a23]">
                            Cash on delivery
                          </span>
                        </div>
                        <p className="mt-1 pl-8 text-[11px] text-[#748172]">
                          Pay when delivered
                        </p>
                      </button>
                    ) : null}
                  </div>
                  {codUnavailableMessage ? (
                    <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-700">
                      <span className="material-symbols-outlined text-base">
                        info
                      </span>
                      {codUnavailableMessage}
                    </div>
                  ) : null}
                  <div className="mt-5 space-y-3 border-t border-dashed border-[#dde7d9] pt-4 text-sm">
                    <div className="flex items-center justify-between text-[#697566]">
                      <span>Subtotal</span>
                      <span className="font-semibold">
                        {currencySymbol}
                        {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#697566]">
                      <span className="flex items-center gap-1.5">
                        Delivery{" "}
                        <span className="rounded-full bg-[#eaf7e7] px-2 py-0.5 text-[10px] font-bold text-[#287123]">
                          FREE
                        </span>
                      </span>
                      <span className="font-semibold">
                        {currencySymbol}
                        {SHIPPING.toFixed(2)}
                      </span>
                    </div>
                    {paymentMethod === "COD" && codCharge > 0 ? (
                      <div className="flex items-center justify-between text-[#697566]">
                        <span>COD charge</span>
                        <span className="font-semibold">
                          {currencySymbol}
                          {codCharge.toFixed(2)}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-end justify-between border-t border-[#e3eadf] pt-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#778373]">
                          Total payable
                        </p>
                        <p className="mt-1 text-xs text-[#889286]">
                          Inclusive of all charges
                        </p>
                      </div>
                      <p className="font-headline text-2xl font-black tracking-tight text-[#1c6518]">
                        {currencySymbol}
                        {total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={paymentDisabled}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d641a] px-4 py-4 font-headline text-base font-black text-white shadow-[0_14px_28px_rgba(30,100,26,0.24)] transition hover:-translate-y-0.5 hover:bg-[#174f15] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                  >
                    <span className="material-symbols-outlined">{paymentButtonIcon}</span>
                    {paymentButtonText}
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[#748171]">
                    <span className="material-symbols-outlined text-base text-[#397d33]">
                      verified_user
                    </span>
                    {!isAuthenticated
                      ? needsGuestOtpVerification
                        ? "Email verification is required for COD orders."
                        : "Your address and payment information are secure."
                      : paymentMethod === "COD"
                        ? "You will pay when your order is delivered."
                        : "Secure prepaid checkout."}
                  </div>
                  {hasStockConflict ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-center text-sm font-medium text-red-600">
                      {stockConflictMessage || "Some items are out of stock."}
                    </p>
                  ) : null}
                  {paymentError ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-center text-sm font-medium text-red-600">
                      {paymentError}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
      {!isPageLoading && checkoutItemCount > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dce7d8] bg-white/95 px-3 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a8678]">
                Total payable
              </p>
              <p className="font-headline text-xl font-black text-[#1c6518]">
                {currencySymbol}
                {total.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePayment}
              disabled={paymentDisabled}
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#1d641a] px-5 text-sm font-black text-white shadow-lg shadow-[#1d641a]/20 disabled:opacity-55"
            >
              <span className="material-symbols-outlined text-lg">{paymentButtonIcon}</span>
              {mobilePaymentButtonText}
            </button>
          </div>
        </div>
      ) : null}
      {isOtpModalOpen ? (
        <CheckoutEmailOtpModal
          email={otpEmail}
          otp={checkoutOtp}
          busy={isOtpBusy}
          error={otpError}
          onOtpChange={setCheckoutOtp}
          onVerify={verifyGuestOtpAndCreateSession}
          onResend={startGuestEmailVerification}
          onClose={() => {
            if (!isOtpBusy) {
              setIsOtpModalOpen(false);
              setOtpError("");
            }
          }}
        />
      ) : null}
    </main>
  );
}
