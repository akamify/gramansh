"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MonitorPlay,
  Package,
  Quote,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { clearAdminSession, getAdminUsername } from "@/app/lib/adminSession";
import { useRequireAdminSession } from "@/app/lib/guards";
import { adminLogout } from "@/app/lib/apiClient";
import { useSiteSettings } from "@/app/context/SiteSettingsContext";

const ADMIN_SIDEBAR_STORAGE_KEY = "gramansh_admin_sidebar_state";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(value?: string | null) {
  const text = String(value || "A").trim();

  if (!text) return "A";

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]?.[0] || ""}${words[1]?.[0] || ""}`.toUpperCase();
  }

  return text.slice(0, 2).toUpperCase();
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isLoginPage = pathname === "/admin/login";
  const { ready } = useRequireAdminSession("/admin/login", !isLoginPage);
  const username = getAdminUsername() || "Admin User";
  const { settings } = useSiteSettings();

  const siteName = settings.siteName || "GRAM ANSH";
  const logoUrl =
    typeof settings.logoUrl === "string" ? settings.logoUrl.trim() : "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);

    if (saved === "collapsed") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    const hadRootDark = root.classList.contains("dark");
    const hadBodyDark = body.classList.contains("dark");
    const previousRootScheme = root.style.colorScheme;
    const previousBodyScheme = body.style.colorScheme;

    root.classList.remove("dark");
    body.classList.remove("dark");
    root.classList.add("admin-force-light");
    body.classList.add("admin-force-light");
    root.style.colorScheme = "light";
    body.style.colorScheme = "light";

    return () => {
      root.style.colorScheme = previousRootScheme;
      body.style.colorScheme = previousBodyScheme;
      root.classList.remove("admin-force-light");
      body.classList.remove("admin-force-light");

      if (hadRootDark) root.classList.add("dark");
      if (hadBodyDark) body.classList.add("dark");
    };
  }, []);

  if (isLoginPage) return <>{children}</>;

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <span className="text-sm font-black text-slate-700">
            Loading admin panel...
          </span>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      /* ignore */
    } finally {
      clearAdminSession();
      window.location.href = "/admin/login";
    }
  };

  const toggleCollapsed = () => {
    setIsCollapsed((current) => {
      const next = !current;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          ADMIN_SIDEBAR_STORAGE_KEY,
          next ? "collapsed" : "expanded",
        );
      }

      return next;
    });
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Analytics", icon: BarChart3, href: "/admin/analytics" },
    { name: "Products", icon: Package, href: "/admin/products" },
    { name: "Orders", icon: ShoppingCart, href: "/admin/orders" },
    { name: "Customers", icon: Users, href: "/admin/customers" },
    { name: "Reviews", icon: MessageSquare, href: "/admin/reviews" },
    { name: "Banners", icon: MonitorPlay, href: "/admin/banners" },
    { name: "Testimonials", icon: Quote, href: "/admin/testimonials" },
    { name: "Comms", icon: Mail, href: "/admin/communications" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  const isActivePath = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const SidebarContent = ({
    collapsed = false,
    mobile = false,
  }: {
    collapsed?: boolean;
    mobile?: boolean;
  }) => (
    <div className="flex h-full flex-col border-r border-[#dbcbaa] bg-[linear-gradient(180deg,#fffdf8_0%,#f6eddb_100%)] text-slate-900">
      <div
        className={cn(
          "border-b border-[#dbcbaa]",
          collapsed ? "px-3 py-4" : "p-5",
        )}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between gap-3",
          )}
        >
          <Link
            href="/admin"
            className={cn(
              "flex min-w-0 items-center",
              collapsed ? "justify-center" : "gap-3",
            )}
            title={siteName}
          >
            <span
              className={cn(
                "grid shrink-0 place-items-center overflow-hidden rounded-[14px] border border-[#d7c39a] bg-[#fff9ef] text-sm font-black text-slate-950 shadow-[0_14px_28px_rgba(89,64,29,0.08)]",
                collapsed ? "h-11 w-11" : "h-12 w-12",
              )}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${siteName} logo`}
                  className="h-full w-full object-contain p-1"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                getInitials(siteName)
              )}
            </span>

            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-lg font-black tracking-[-0.04em] text-[#234a22]">
                  {siteName}
                  <span className="text-[#9a6a2f]">.</span>CORE
                </span>
                <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.32em] text-[#9a7743]">
                  Operations Console
                </span>
              </span>
            ) : null}
          </Link>

          {mobile ? (
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-[10px] text-[#8f7d5f] transition hover:bg-[#f2e4ca] hover:text-[#234a22] active:scale-[0.96]"
              aria-label="Close sidebar"
            >
              <X size={18} strokeWidth={2.6} />
            </button>
          ) : null}
        </div>
{/* 
        {!collapsed ? (
          <div className="mt-4 rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-xs font-black text-slate-950">
              {username}
            </p>
          </div>
        ) : null} */}
      </div>

      <nav
        className={cn(
          "admin-sidebar-scroll flex-1 space-y-1 overflow-y-auto",
          collapsed ? "px-3 py-4" : "px-3 py-5",
        )}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "group relative flex items-center rounded-[12px] text-sm font-black transition-all duration-200",
                collapsed
                  ? "h-11 justify-center px-0"
                  : "h-11 gap-3 px-3",
                isActive
                  ? "bg-[linear-gradient(135deg,#234a22,#3a6a2e)] text-white shadow-[0_14px_28px_rgba(35,74,34,0.24)]"
                  : "text-[#62553e] hover:bg-[#f5ead5] hover:text-[#234a22]",
              )}
            >
              {isActive ? (
                <span
                  className={cn(
                    "absolute rounded-full bg-[#c48b37]",
                    collapsed
                      ? "-left-1 top-1/2 h-6 w-1 -translate-y-1/2"
                      : "left-0 top-1/2 h-5 w-1 -translate-y-1/2",
                  )}
                />
              ) : null}

              <Icon
                size={18}
                strokeWidth={2.4}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-[#867454] group-hover:text-[#9a6a2f]",
                )}
              />

              {!collapsed ? (
                <span className="truncate text-[11px] uppercase tracking-[0.12em]">
                  {item.name}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-[#dbcbaa] bg-[linear-gradient(180deg,rgba(251,247,239,0.9),rgba(244,234,213,0.95))]",
          collapsed ? "p-3" : "p-4",
        )}
      >
        <div
          className={cn(
            "rounded-[18px] border border-[#dbcbaa] bg-[linear-gradient(135deg,#fffdf8,#f3e6c9)]",
            collapsed ? "grid gap-2 p-2" : "p-3",
          )}
        >
          <div
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "gap-3",
            )}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[linear-gradient(135deg,#234a22,#3a6a2e)] text-xs font-black text-white shadow-[0_10px_24px_rgba(35,74,34,0.22)]">
              {getInitials(username)}
            </div>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-[#203f1f]">
                  {username}
                </p>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#9a7743]">
                  Gram Ansh Admin
                </p>
              </div>
            ) : null}

            {!collapsed ? (
              <button
                type="button"
                onClick={handleLogout}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[#8f7d5f] transition hover:bg-[#f3e6cf] hover:text-[#8a5320] active:scale-[0.96]"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={17} strokeWidth={2.6} />
              </button>
            ) : null}
          </div>

          {collapsed ? (
            <button
              type="button"
              onClick={handleLogout}
              className="grid h-9 w-full place-items-center rounded-[10px] text-[#8f7d5f] transition hover:bg-[#f3e6cf] hover:text-[#8a5320] active:scale-[0.96]"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={17} strokeWidth={2.6} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex min-h-screen overflow-hidden bg-[#f7f2e8] text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col transition-[width] duration-300 lg:flex",
          isCollapsed ? "w-20" : "w-72",
        )}
      >
        <SidebarContent collapsed={isCollapsed} />

        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-4 top-6 grid h-8 w-8 place-items-center rounded-full border border-[#dbcbaa] bg-[#fffaf0] text-[#6e6147] shadow-[0_12px_24px_rgba(89,64,29,0.12)] transition hover:border-[#bb9657] hover:text-[#234a22] active:scale-[0.96]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight size={16} strokeWidth={2.8} />
          ) : (
            <ChevronLeft size={16} strokeWidth={2.8} />
          )}
        </button>
      </aside>

      <AnimatePresence>
        {isMobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-[70] w-[292px] overflow-hidden shadow-2xl lg:hidden"
            >
              <SidebarContent collapsed={false} mobile />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div
        className={cn(
          "relative flex min-h-screen w-full flex-1 flex-col transition-[margin] duration-300",
          isCollapsed ? "lg:ml-20" : "lg:ml-72",
        )}
      >
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#dbcbaa] bg-[rgba(255,250,241,0.96)] px-4 py-3 text-slate-900 backdrop-blur lg:hidden">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-[#d7c39a] bg-[#fffaf0] text-xs font-black text-slate-950 shadow-[0_10px_22px_rgba(89,64,29,0.08)]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${siteName} logo`}
                  className="h-full w-full object-contain p-1"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                getInitials(siteName)
              )}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-[-0.04em] text-[#234a22]">
                {siteName}
              </span>
              <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[#9a7743]">
                Operations Console
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#dbcbaa] bg-[#fffaf0] text-[#234a22] transition hover:bg-[#f5ead6] active:scale-[0.96]"
            aria-label="Open sidebar"
          >
            <Menu size={22} strokeWidth={2.6} />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-6 lg:p-8">
          {children}

          <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 sm:flex-row">
            <span>© 2026 {siteName} Management Protocol</span>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                System Online
              </span>
              <span>v4.0.2 Stable</span>
            </div>
          </footer>
        </main>
      </div>

      <style jsx global>{`
        .admin-force-light {
          color-scheme: light !important;
        }

        .admin-shell {
          color-scheme: light;
          background:
            radial-gradient(circle at top left, rgba(229, 209, 165, 0.34), transparent 30%),
            linear-gradient(180deg, #fcf8f0 0%, #f5eddc 100%);
        }

        .admin-sidebar-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior: contain;
        }

        .admin-sidebar-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-shell,
          .admin-shell * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
