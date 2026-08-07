"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Heart,
  Headphones,
  House,
  LogIn,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  Store,
  Truck,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { getWholesaleWhatsAppUrl } from "@/app/lib/whatsapp";

type NavLink = {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
};

const BRAND_NAME = "Gram Ansh";
const BRAND_LOGO = "/gramansh.png";
const BRAND_TAGLINE = "Cold Press Oil & Natural Masala";
const WHOLESALE_WHATSAPP_URL = getWholesaleWhatsAppUrl();
const CURRENT_YEAR = new Date().getFullYear();

const PRIMARY_LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/shop", label: "Shop", icon: "storefront" },
  { href: "/user/orders", label: "My Orders", icon: "inventory_2" },
  { href: "/user/wishlist", label: "Wishlist", icon: "favorite" },
];

const DRAWER_LINKS: NavLink[] = [
  ...PRIMARY_LINKS,
  {
    href: WHOLESALE_WHATSAPP_URL,
    label: "Wholesale Orders",
    icon: "local_shipping",
    external: true,
  },
];

const FOCUSABLE_DRAWER_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const NAVBAR_ICONS: Record<string, LucideIcon> = {
  arrow_forward: ArrowRight,
  chevron_right: ChevronRight,
  close: X,
  eco: Sprout,
  external: ExternalLink,
  favorite: Heart,
  home: House,
  inventory_2: Package,
  local_shipping: Truck,
  login: LogIn,
  logout: LogOut,
  menu: Menu,
  person: User,
  search: Search,
  shopping_cart: ShoppingCart,
  storefront: Store,
  support_agent: Headphones,
  verified: ShieldCheck,
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MaterialIcon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const iconName = String(children);
  const IconComponent = NAVBAR_ICONS[iconName] ?? CircleHelp;

  return (
    <IconComponent
      aria-hidden="true"
      strokeWidth={2}
      className={`shrink-0 ${className}`}
    />
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const { itemCount, isHydrating } = useCart();
  const { isAuthenticated, logout } = useAuth();

  const stableCartCount = isHydrating ? 0 : itemCount;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const drawer = closeButtonRef.current?.closest<HTMLElement>(
        'aside[role="dialog"]',
      );
      const focusableElements = drawer?.querySelectorAll<HTMLElement>(
        FOCUSABLE_DRAWER_SELECTORS,
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    void logout();
    setSidebarOpen(false);
  };

  return (
    <>
      <header
        className={`sticky inset-x-0 top-0 z-[100] w-full font-sans transition-[box-shadow,transform] duration-300 ${
          scrolled
            ? "shadow-[0_18px_50px_rgba(50,35,18,0.16)]"
            : "shadow-[0_8px_28px_rgba(36,52,23,0.08)]"
        }`}
      >
        <div className="border-b border-[#e5dac8]/90 bg-[rgba(255,252,246,0.94)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(255,252,246,0.86)]">
          <div className="mx-auto max-w-[1536px] px-3 sm:px-5 lg:px-8">
            <div
              className={`flex items-center gap-2.5 transition-[min-height] duration-300 sm:gap-3 lg:gap-4 xl:gap-6 ${
                scrolled
                  ? "min-h-[66px] lg:min-h-[70px]"
                  : "min-h-[72px] lg:min-h-[80px]"
              }`}
            >
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-navigation"
                onClick={() => setSidebarOpen(true)}
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#dfd3c0] bg-white/90 text-[#274a22] shadow-[0_8px_20px_rgba(67,48,25,0.08)] transition hover:-translate-y-0.5 hover:border-[#ba873b] hover:bg-[#fff9ed] hover:text-[#875016] active:translate-y-0 active:scale-95 lg:hidden"
              >
                <Menu className="h-[22px] w-[22px] transition group-hover:scale-105" />
              </button>

              <Link
                href="/"
                aria-label={`${BRAND_NAME} home`}
                className="group flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 lg:w-[290px] lg:flex-none xl:w-[340px]"
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#decfab] bg-white p-0.5 shadow-[0_10px_28px_rgba(70,96,43,0.16)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[#c58c39] sm:h-[52px] sm:w-[52px]">
                  <span className="relative h-full w-full overflow-hidden rounded-full bg-[#faf5e9]">
                    <Image
                      src={BRAND_LOGO}
                      alt={`${BRAND_NAME} logo`}
                      fill
                      sizes="52px"
                      className="object-contain"
                      priority
                    />
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2f612a] text-white ring-2 ring-[#fffdf8] sm:h-[18px] sm:w-[18px]">
                    <BadgeCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </span>
                </span>

                <span className="min-w-0">
                  <span className="font-headline block truncate text-[19px] font-bold leading-none tracking-[-0.05em] text-[#24461e] transition group-hover:text-[#7b4516] sm:text-[24px] lg:text-[29px]">
                    {BRAND_NAME}
                  </span>
                  <span className="mt-1.5 block max-w-[220px] truncate text-[8px] font-black uppercase leading-none tracking-[0.18em] text-[#a26b2c] sm:max-w-[260px] sm:text-[9px] lg:text-[10px]">
                    {BRAND_TAGLINE}
                  </span>
                </span>
              </Link>

              <form
                onSubmit={handleSearch}
                role="search"
                className="hidden min-w-0 lg:block lg:flex-[1_1_460px] lg:max-w-[540px] xl:max-w-[620px]"
              >
                <div className="group flex h-[50px] overflow-hidden rounded-[18px] border border-[#ded2c0] bg-white/82 shadow-[0_8px_24px_rgba(59,42,22,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] transition focus-within:border-[#4e7a3c] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dfead7]">
                  <div className="flex w-12 shrink-0 items-center justify-center text-[#8d7b64] transition group-focus-within:text-[#37642c]">
                    <Search className="h-[21px] w-[21px]" />
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search oils, masala and natural products"
                    aria-label="Search products"
                    className="min-w-0 flex-1 bg-transparent pr-3 text-sm font-semibold text-[#30271e] outline-none placeholder:font-medium placeholder:text-[#9b8a74]"
                  />
                  <button
                    type="submit"
                    className="m-1.5 inline-flex shrink-0 items-center gap-2 rounded-[13px] bg-[linear-gradient(135deg,#285b25_0%,#4c7532_100%)] px-5 text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(50,97,42,0.22)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
                  >
                    Search
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
                <Link
                  href={isAuthenticated ? "/user/profile" : "/user/auth"}
                  className="group hidden min-h-11 items-center gap-2 rounded-2xl px-2.5 text-[#5b4734] transition hover:bg-[#f5ecde] hover:text-[#285b25] lg:flex xl:px-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3ebdf] transition group-hover:bg-white">
                    <User className="h-[20px] w-[20px]" />
                  </span>
                  <span className="hidden text-left 2xl:block">
                    <span className="block text-[10px] font-semibold leading-none text-[#9c8a72]">
                      {isAuthenticated ? "Welcome back" : "Hello, sign in"}
                    </span>
                    <span className="mt-1 block text-xs font-extrabold leading-none text-[#30271e] group-hover:text-[#285b25]">
                      {isAuthenticated ? "My Account" : "Account"}
                    </span>
                  </span>
                </Link>

                <Link
                  href="/user/orders"
                  className="group hidden min-h-11 items-center gap-2 rounded-2xl px-3 text-[#5b4734] transition hover:bg-[#f5ecde] hover:text-[#285b25] 2xl:flex"
                >
                  <Package className="h-[21px] w-[21px]" />
                  <span className="text-xs font-extrabold">Orders</span>
                </Link>

                <Link
                  href="/user/wishlist"
                  aria-label="Wishlist"
                  className="hidden h-11 w-11 items-center justify-center rounded-2xl text-[#5b4734] transition hover:-translate-y-0.5 hover:bg-[#faeee8] hover:text-[#a14132] active:translate-y-0 active:scale-95 lg:flex"
                >
                  <Heart className="h-[22px] w-[22px]" />
                </Link>

                <Link
                  href="/cart"
                  aria-label={
                    stableCartCount > 0
                      ? `Cart, ${stableCartCount} items`
                      : "Cart"
                  }
                  data-cart-target
                  className="group relative flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#e4d7c1] bg-white/85 px-3 text-[#30271e] shadow-[0_8px_20px_rgba(59,42,22,0.06)] transition hover:-translate-y-0.5 hover:border-[#d0a65e] hover:bg-[#fff7e8] hover:text-[#7b4516] active:translate-y-0 active:scale-95"
                >
                  <span className="relative">
                    <ShoppingCart className="h-[23px] w-[23px]" />
                    {stableCartCount > 0 && (
                      <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#bd7d25] px-1 text-[10px] font-black leading-none text-white ring-2 ring-[#fffdf8]">
                        {stableCartCount > 99 ? "99+" : stableCartCount}
                      </span>
                    )}
                  </span>
                  <span className="hidden text-xs font-extrabold sm:block">
                    Cart
                  </span>
                </Link>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              role="search"
              className="pb-3 lg:hidden"
            >
              <div className="group flex h-11 overflow-hidden rounded-2xl border border-[#dfd3c0] bg-white/88 shadow-[0_6px_18px_rgba(61,43,22,0.05)] transition focus-within:border-[#4e7a3c] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dfead7]">
                <div className="flex w-11 shrink-0 items-center justify-center text-[#8d7b64] group-focus-within:text-[#37642c]">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search natural products..."
                  aria-label="Search products"
                  className="min-w-0 flex-1 bg-transparent pr-2 text-sm font-semibold text-[#30271e] outline-none placeholder:font-medium placeholder:text-[#9b8a74]"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="m-1 flex w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#285b25_0%,#4c7532_100%)] text-white transition hover:brightness-105 active:scale-95"
                >
                  <ArrowRight className="h-[18px] w-[18px]" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden border-b border-[#25431f] bg-[linear-gradient(100deg,#173f1b_0%,#285426_52%,#744015_100%)] text-white lg:block">
          <div className="mx-auto flex h-12 max-w-[1536px] items-center px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="mr-2 flex h-8 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs font-extrabold transition hover:bg-white/16"
            >
              <Menu className="h-[18px] w-[18px]" />
              All Menu
            </button>

            <span className="mx-2 h-5 w-px bg-white/15" />

            <nav
              className="flex min-w-0 items-center"
              aria-label="Store navigation"
            >
              {PRIMARY_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex h-12 items-center gap-2 px-4 text-xs font-extrabold transition ${
                      active
                        ? "text-[#ffdd9f]"
                        : "text-[#f5eee3] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <MaterialIcon className="h-[17px] w-[17px] transition group-hover:-translate-y-0.5">
                      {link.icon}
                    </MaterialIcon>
                    {link.label}
                    {active && (
                      <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#e2a94d]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 xl:flex">
                <Sparkles className="h-3.5 w-3.5 text-[#f1bd67]" />
                Pure • Natural • Trusted
              </span>

              <a
                href={WHOLESALE_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 shrink-0 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#e2aa4d_0%,#b8731d_100%)] px-4 text-xs font-black text-white shadow-[0_10px_22px_rgba(110,59,16,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
              >
                <Truck className="h-[17px] w-[17px]" />
                Wholesale
              </a>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[200] transition ${
          sidebarOpen ? "visible" : "invisible"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <button
          type="button"
          tabIndex={sidebarOpen ? 0 : -1}
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className={`absolute inset-0 bg-[#17130f]/62 backdrop-blur-[3px] transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          data-lenis-prevent
          className={`absolute left-0 top-0 flex h-dvh w-[92vw] max-w-[410px] flex-col overflow-hidden bg-[#fffdf8] shadow-[28px_0_70px_rgba(22,16,10,0.28)] transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(145deg,#173f1b_0%,#2d5d28_48%,#784116_100%)] px-5 pb-5 pt-5 text-white sm:px-6 sm:pt-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#efb654]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex min-w-0 items-center gap-3.5"
              >
                <span className="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border border-white/35 bg-white p-0.5 shadow-[0_12px_26px_rgba(20,20,20,0.2)] sm:h-[64px] sm:w-[64px]">
                  <span className="relative h-full w-full overflow-hidden rounded-full bg-[#faf5e9]">
                    <Image
                      src={BRAND_LOGO}
                      alt={`${BRAND_NAME} logo`}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </span>
                </span>

                <span className="min-w-0 self-center">
                  <span className="block max-w-[220px] truncate text-[23px] font-black leading-none tracking-[-0.045em] text-white">
                    {BRAND_NAME}
                  </span>
                  <span className="mt-2 block max-w-[220px] text-[9px] font-extrabold uppercase leading-tight tracking-[0.16em] text-[#ffda94]">
                    {BRAND_TAGLINE}
                  </span>
                </span>
              </Link>

              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation menu"
                onClick={() => {
                  setSidebarOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
              >
                <X className="h-[21px] w-[21px]" />
              </button>
            </div>

            <Link
              href={isAuthenticated ? "/user/profile" : "/user/auth"}
              onClick={() => setSidebarOpen(false)}
              className="relative mt-5 flex items-center gap-3 rounded-[22px] border border-white/15 bg-white/10 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition hover:bg-white/15"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e0aa4e_0%,#b66f1b_100%)] text-white shadow-[0_8px_18px_rgba(95,52,13,0.3)]">
                {isAuthenticated ? (
                  <User className="h-[21px] w-[21px]" />
                ) : (
                  <LogIn className="h-[21px] w-[21px]" />
                )}
              </span>

              <span className="min-w-0">
                <span className="block text-[15px] font-black tracking-[-0.02em]">
                  {isAuthenticated ? "My Account" : "Sign in or Register"}
                </span>
                <span className="mt-1 block text-xs text-white/70">
                  {isAuthenticated
                    ? "Profile, orders and preferences"
                    : "Track orders and save favourites"}
                </span>
              </span>

              <ChevronRight className="ml-auto h-5 w-5 text-[#ffda94]/90" />
            </Link>
          </div>

          <nav
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-5"
            aria-label="Mobile navigation"
            data-lenis-prevent
          >
            <p className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
              Explore
            </p>

            <div className="space-y-1.5">
              {DRAWER_LINKS.map((link) => {
                const active =
                  !link.external && isActivePath(pathname, link.href);

                const className = `group flex min-h-[58px] items-center gap-3 rounded-2xl px-3 transition ${
                  active
                    ? "bg-[#edf5e8] text-[#24461e] ring-1 ring-[#d7e5cd]"
                    : "text-[#5b4734] hover:bg-[#f6efe4]"
                }`;

                const content = (
                  <>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        active
                          ? "bg-[#2d5d28] text-white shadow-[0_8px_16px_rgba(45,93,40,0.2)]"
                          : "bg-[#efe5d7] text-[#7c4718] group-hover:bg-white group-hover:text-[#2d5d28]"
                      }`}
                    >
                      <MaterialIcon className="h-[20px] w-[20px]">
                        {link.icon}
                      </MaterialIcon>
                    </span>
                    <span className="text-sm font-extrabold">{link.label}</span>
                    {link.external ? (
                      <ExternalLink className="ml-auto h-[18px] w-[18px] text-[#b9a58e] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#7c4718]" />
                    ) : (
                      <ChevronRight className="ml-auto h-5 w-5 text-[#b9a58e] transition group-hover:translate-x-0.5 group-hover:text-[#7c4718]" />
                    )}
                  </>
                );

                if (link.external) {
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSidebarOpen(false)}
                      className={className}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={className}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>

            <div className="my-5 h-px bg-[#e6dccd]" />

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: "Trusted" },
                { icon: Sprout, label: "Natural" },
                { icon: Truck, label: "Delivery" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#e6dccd] bg-[#fbf7f0] px-2 py-3 text-center shadow-[0_6px_16px_rgba(61,43,22,0.04)]"
                >
                  <Icon className="mx-auto h-5 w-5 text-[#2d5d28]" />
                  <span className="mt-1.5 block text-[9px] font-black uppercase tracking-wide text-[#8f7d66]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-extrabold text-[#a13b2b] transition hover:bg-[#fcebe6]"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            )}
          </nav>

          <div className="border-t border-[#e6dccd] bg-[#fbf7f0] p-4">
            <a
              href={WHOLESALE_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSidebarOpen(false)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#e0aa4e_0%,#b66f1b_100%)] px-4 text-sm font-black text-white shadow-[0_10px_22px_rgba(104,58,14,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.99]"
            >
              <Headphones className="h-5 w-5" />
              Bulk Order on WhatsApp
            </a>
            <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-[#9b8972]">
              © {CURRENT_YEAR} {BRAND_NAME}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
