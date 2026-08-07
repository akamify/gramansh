"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/app/context/CartContext";
import ProductGridSkeleton from "@/app/components/ProductGridSkeleton";
import ResilientProductImage from "@/app/components/ResilientProductImage";
import type { Product } from "@/app/data/products";
import { createProductHref } from "@/app/data/products";
import { fetchBackendProducts } from "@/app/lib/backendProducts";
import { flyImageToCart } from "@/app/lib/flyToCart";
import { productMatchesWeightFilters, resolveListingVariant } from "@/app/lib/shopListing";

const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A to Z", value: "name-asc" },
  { label: "Name: Z to A", value: "name-desc" },
];

export default function SearchPage() {
  const { addItem, isVariantInCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [checkedCategories, setCheckedCategories] = useState<string[]>([]);
  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("featured");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const PRODUCTS_PER_PAGE = 9;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchBackendProducts();
        setProducts(data);
        if (data.length > 0) {
          const maxPriceVal = Math.ceil(Math.max(...data.map((p) => p.price)));
          setMaxPrice(maxPriceVal);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const CATEGORIES = useMemo(
    () => [...new Set(products.map((p) => p.category).filter((category): category is string => Boolean(category)))],
    [products]
  );

  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const activeFilterCount = checkedCategories.length + selectedWeights.length + (maxPrice < priceRange.max ? 1 : 0);
  const AVAILABLE_WEIGHTS = useMemo(() => ["100g", "250g", "500g", "1kg", "2kg", "5kg"], []);

  const filteredProducts = useMemo(() => {
    let results = products;
    if (query.trim()) {
      const sq = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(sq) ||
          String(p.description || "").toLowerCase().includes(sq) ||
          String(p.category || "").toLowerCase().includes(sq)
      );
    }
    if (checkedCategories.length > 0) results = results.filter((p) => checkedCategories.includes(String(p.category || "")));
    results = results.filter((p) => p.price <= maxPrice);
    if (selectedWeights.length > 0) {
      results = results.filter((p) => productMatchesWeightFilters(p, selectedWeights));
    }
    return results;
  }, [products, query, checkedCategories, maxPrice, selectedWeights]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, checkedCategories, maxPrice, selectedWeights]);

  const getSortedResults = () => {
    const sorted = [...filteredProducts];
    switch (sortOption) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "name-asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  };

  const handleAddToCart = (product: Product, event?: React.MouseEvent) => {
    const variant = resolveListingVariant(product, selectedWeights);
    if (variant.stock <= 0) return;

    try {
      const card = (event?.currentTarget as HTMLElement | null)?.closest?.("[data-product-card]") as HTMLElement | null;
      const img = card?.querySelector?.("img") as HTMLImageElement | null;
      const fromRect = img?.getBoundingClientRect?.() ?? (event?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect?.();
      const imageUrl = String(img?.currentSrc || img?.src || variant.image || product.image || "").trim();
      if (fromRect && imageUrl) {
        flyImageToCart({ imageUrl, fromRect, durationMs: 950 });
      }
    } catch {
      // ignore
    }

    addItem({
      id: product.id,
      name: product.name,
      price: variant.price,
      color: "",
      size: variant.label,
      image: variant.image,
      collection: product.collection || "SEARCH RESULTS",
    });
  };

  const toggleCat = (c: string) => setCheckedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  const toggleWeight = (w: string) => setSelectedWeights((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]);
  const clearAllFilters = () => {
    setQuery("");
    setCheckedCategories([]);
    setMaxPrice(priceRange.max);
    setSelectedWeights([]);
  };
  const closeMobileFilter = () => {
    setShowMobileFilter(false);
    setShowSortDropdown(false);
  };

  return (
    <main className="pt-28 pb-16 px-6 md:px-12 max-w-[1440px] mx-auto relative">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
        <nav className="flex text-xs font-label text-on-surface-variant mb-6 gap-2 uppercase tracking-widest">
          <Link href="/shop" className="hover:text-secondary transition-colors">Shop</Link>
          <span className="opacity-40">/</span>
          <span className="text-secondary font-bold">Search</span>
        </nav>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-tighter leading-none">
              Results for <br />
              <span className="italic text-secondary font-serif font-light">&ldquo;{query || "All Collections"}&rdquo;</span>
            </h1>
            <p className="mt-6 text-on-surface-variant font-body text-lg border-l-2 border-secondary/30 pl-4">
              A curated selection of {filteredProducts.length} premium products.
            </p>
          </div>
          <div className="relative w-full max-w-md group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-secondary/10 font-body outline-none transition-all placeholder:text-on-surface-variant/50"
              placeholder="Search oils, masalas..."
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:scale-110 transition-transform">search</span>
          </div>
        </div>
      </motion.header>

      <div className="lg:hidden mb-10 flex items-center gap-4">
        <button onClick={() => setShowMobileFilter(true)} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-sm border border-outline-variant hover:border-secondary transition-all active:scale-95">
          <span className="material-symbols-outlined text-xl">tune</span>
          <span className="font-bold text-sm uppercase tracking-widest">Filter & Sort</span>
          {activeFilterCount > 0 && (
            <span className="min-w-7 h-7 px-2 rounded-full bg-secondary text-white text-[11px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showSortDropdown && (
        <div className="lg:hidden mb-6 relative">
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant shadow-lg overflow-x-auto">
            <div className="flex gap-2 p-3 min-w-max">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortOption(option.value);
                    setShowSortDropdown(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all ${sortOption === option.value ? "bg-primary text-white" : "bg-surface text-on-surface hover:bg-surface-container-high"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-16">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-32 space-y-12">
            <section className="bg-surface-container-low/50 p-8 rounded-[1rem] border border-outline-variant/30 backdrop-blur-md">
              <h3 className="font-headline text-2xl font-bold text-primary mb-8 tracking-tight">Filters</h3>

              <div className="space-y-10">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-6">By Category</h4>
                  <div className="space-y-4">
                    {CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-4 group cursor-pointer">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${checkedCategories.includes(cat) ? "bg-secondary border-secondary" : "border-outline-variant group-hover:border-secondary"}`}>
                          {checkedCategories.includes(cat) && <span className="material-symbols-outlined text-white text-lg">check</span>}
                        </div>
                        <input type="checkbox" className="hidden" checked={checkedCategories.includes(cat)} onChange={() => toggleCat(cat)} readOnly />
                        <span className={`font-medium transition-colors ${checkedCategories.includes(cat) ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"}`}>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-6">Price Range</h4>
                  <input type="range" className="w-full accent-secondary h-1.5 bg-outline-variant rounded-lg appearance-none cursor-pointer" min={priceRange.min} max={priceRange.max} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                  <div className="flex justify-between mt-4 text-sm font-bold text-primary">
                    <span>Rs {priceRange.min}</span>
                    <span className="bg-secondary/10 px-3 py-1 rounded-md text-secondary">Up to Rs {maxPrice}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-6">Weight</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_WEIGHTS.map((w) => (
                      <button key={w} onClick={() => toggleWeight(w)} className={`px-4 py-3 text-xs font-bold rounded-xl border transition-all ${selectedWeights.includes(w) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-outline-variant hover:border-secondary"}`}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={clearAllFilters} className="w-full text-xs font-bold text-secondary uppercase tracking-widest hover:underline transition-all underline-offset-8">Reset All</button>
              </div>
            </section>

            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 group hover:bg-secondary/20 transition-all duration-500">
              <span className="material-symbols-outlined text-secondary text-4xl mb-4 icon-filled group-hover:rotate-12 transition-transform">verified_user</span>
              <h5 className="font-headline text-lg font-bold text-primary">Agrarian Grade</h5>
              <p className="text-xs font-body text-on-surface-variant mt-2 leading-relaxed italic opacity-80">&ldquo;Purity tested in small batches for uncompromised quality.&rdquo;</p>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="hidden lg:flex items-center justify-between mb-12 bg-white p-2 rounded-2xl border border-outline-variant/30">
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortOption(option.value)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${sortOption === option.value ? "bg-primary text-white shadow-xl" : "text-on-surface-variant hover:bg-surface-variant/20"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="px-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{filteredProducts.length} Results</p>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <ProductGridSkeleton key="skeleton" count={9} />
            ) : filteredProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center bg-surface-container-lowest rounded-[3rem] border border-dashed border-outline-variant">
                <span className="material-symbols-outlined text-7xl text-outline mb-6 opacity-30">search_off</span>
                <h3 className="font-headline text-2xl text-primary font-bold">Nothing matches your search</h3>
                <p className="text-on-surface-variant mt-2 mb-8">Try adjusting your filters or keywords.</p>
                <button onClick={clearAllFilters} className="px-8 py-3 bg-secondary text-on-secondary rounded-full font-label text-xs uppercase tracking-widest">Clear Filters</button>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-20">
                {getSortedResults().slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE).map((p) => {
                  const variant = resolveListingVariant(p, selectedWeights);
                  const inStock = variant.stock > 0;
                  const inCart = isVariantInCart(p.id, variant.label, "");
                  const productHref = createProductHref(p, variant.label);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={p.id}
                      data-product-card
                      className="group relative"
                    >
                      <div className="flex flex-row sm:block gap-4 sm:gap-0 items-center">

                        {/* IMAGE */}
                        <Link
                          href={productHref}
                          className="block shrink-0"
                        >
                          <div className="relative overflow-hidden rounded-[1rem] bg-surface-container-high w-28 h-30 sm:w-auto sm:h-auto sm:aspect-square sm:mb-6 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/5 transition-all duration-700">
                            <ResilientProductImage
                              sources={[variant.image, p.image, ...(p.images || [])]}
                              alt={p.name}
                              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {!inStock ? <div className="absolute inset-0 z-[2] flex items-center justify-center bg-stone-950/45"><span className="rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-error">Out of Stock</span></div> : null}

                            {/* DESKTOP FLOATING BUTTON */}
                            <div className="hidden sm:block absolute bottom-6 right-6">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.preventDefault();

                                  if (inCart) {
                                    window.location.href = "/cart";
                                    return;
                                  }

                                  if (inStock) handleAddToCart(p, e);
                                }}
                                disabled={!inCart && !inStock}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md transition-all duration-500 ${inCart
                                    ? "bg-secondary text-on-secondary"
                                    : "bg-white/90 text-primary hover:bg-primary hover:text-white"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <span className="material-symbols-outlined text-2xl">
                                  {inCart
                                    ? "shopping_bag"
                                    : inStock
                                      ? "add_shopping_cart"
                                      : "block"}
                                </span>
                              </motion.button>
                            </div>
                          </div>
                        </Link>

                        {/* CONTENT */}
                        <div className="flex-1 px-1 sm:px-2">
                          <Link
                            href={productHref}
                          >
                            <div className="space-y-2">
                              <h3 className="font-headline text-base sm:text-lg lg:text-xl font-bold text-primary group-hover:text-secondary transition-colors duration-300 truncate max-w-[180px] sm:max-w-none">
                                {p.name}
                              </h3>

                              <div className="flex items-center gap-2">
                                <span className="font-headline text-lg sm:text-xl text-secondary">
                                  Rs {variant.price}
                                </span>

                                {variant.originalPrice && (
                                  <span className="text-[10px] sm:text-xs text-on-surface-variant line-through opacity-40 italic">
                                    Rs {variant.originalPrice}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>

                          {/* MOBILE BUTTON */}
                          <div className="sm:hidden mt-3">
                            <button
                              onClick={(e) => {
                                if (inCart) {
                                  window.location.href = "/cart";
                                  return;
                                }

                                if (inStock) handleAddToCart(p, e);
                              }}
                              disabled={!inCart && !inStock}
                              className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all ${inCart
                                  ? "bg-secondary text-white"
                                  : "bg-primary text-white"
                                } disabled:opacity-50`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {inCart
                                  ? "shopping_bag"
                                  : inStock
                                    ? "add_shopping_cart"
                                    : "block"}
                              </span>

                              {inCart ? (inStock ? "Go to Cart" : "Review Cart") : inStock ? "Add to Cart" : "Out of Stock"}
                            </button>
                          </div>

                          {inCart && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="hidden sm:flex items-center gap-1 text-[10px] text-secondary font-black uppercase tracking-widest mt-2"
                            >
                              <span className="material-symbols-outlined text-xs">
                                check_circle
                              </span>

                              In Cart
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="mt-20 flex items-center justify-center gap-4">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="w-14 h-14 rounded-2xl border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-20"><span className="material-symbols-outlined">west</span></button>
              <div className="flex bg-surface-container-low p-2 rounded-2xl border border-outline-variant/50">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setCurrentPage(n)} className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${currentPage === n ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:text-primary"}`}>{n}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="w-14 h-14 rounded-2xl border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-20"><span className="material-symbols-outlined">east</span></button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showMobileFilter && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMobileFilter} className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-[70] h-[85vh] bg-surface-container-lowest rounded-t-[2rem] p-8">
              <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-headline text-3xl font-bold text-primary">Refine</h2>
                <button onClick={closeMobileFilter} className="w-12 h-12 rounded-[2rem] bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div
                className="h-[calc(100%-128px)] overflow-y-auto overscroll-contain touch-pan-y space-y-8 pb-28 pr-1"
                data-lenis-prevent="true"
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
              >
                <section className="bg-surface-container-low/50 border border-outline-variant/20 rounded-[2rem] p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant font-black mb-2">Sort By</p>
                      <h4 className="text-xl font-bold text-primary">Shape your results</h4>
                    </div>
                    <span className="material-symbols-outlined text-secondary">swap_vert</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortOption(option.value)}
                        className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all ${sortOption === option.value ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-outline-variant text-primary"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="bg-surface-container-low/50 border border-outline-variant/20 rounded-[2rem] p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant font-black mb-2">Search Query</p>
                      <h4 className="text-xl font-bold text-primary">Fine tune keyword</h4>
                    </div>
                    <span className="material-symbols-outlined text-secondary">search</span>
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white border border-outline-variant/30 rounded-2xl px-5 py-4 text-sm font-body outline-none"
                    placeholder="Search oils, masalas..."
                  />
                </section>

                <section className="bg-surface-container-low/50 border border-outline-variant/20 rounded-[2rem] p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant font-black mb-2">By Category</p>
                      <h4 className="text-xl font-bold text-primary">Pick your favorites</h4>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">{checkedCategories.length} selected</span>
                  </div>
                  <div className="space-y-3">
                    {CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-4 group cursor-pointer rounded-2xl border border-outline-variant/20 bg-white px-4 py-4">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${checkedCategories.includes(cat) ? "bg-secondary border-secondary" : "border-outline-variant group-hover:border-secondary"}`}>
                          {checkedCategories.includes(cat) && <span className="material-symbols-outlined text-white text-lg">check</span>}
                        </div>
                        <input type="checkbox" className="hidden" checked={checkedCategories.includes(cat)} onChange={() => toggleCat(cat)} readOnly />
                        <span className={`font-medium transition-colors ${checkedCategories.includes(cat) ? "text-primary font-bold" : "text-on-surface-variant group-hover:text-primary"}`}>{cat}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="bg-surface-container-low/50 border border-outline-variant/20 rounded-[2rem] p-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant font-black mb-2">Price Range</p>
                      <h4 className="text-xl font-bold text-primary">Set your ceiling</h4>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-black">Up to Rs {maxPrice}</span>
                  </div>
                  <input type="range" className="w-full accent-secondary h-1.5 bg-outline-variant rounded-lg appearance-none cursor-pointer" min={priceRange.min} max={priceRange.max} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                  <div className="flex justify-between mt-4 text-sm font-bold text-primary">
                    <span>Rs {priceRange.min}</span>
                    <span>Rs {priceRange.max}</span>
                  </div>
                </section>

                <section className="bg-surface-container-low/50 border border-outline-variant/20 rounded-[2rem] p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant font-black mb-2">Weight</p>
                      <h4 className="text-xl font-bold text-primary">Choose pack size</h4>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">{selectedWeights.length} selected</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_WEIGHTS.map((w) => (
                      <button key={w} onClick={() => toggleWeight(w)} className={`px-4 py-3 text-xs font-bold rounded-xl border transition-all ${selectedWeights.includes(w) ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-outline-variant hover:border-secondary"}`}>
                        {w}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest to-transparent">
                <div className="flex items-center gap-3">
                  <button onClick={clearAllFilters} className="flex-1 rounded-2xl border border-outline-variant px-4 py-4 text-xs font-bold uppercase tracking-[0.22em] text-primary">Reset All</button>
                  <button onClick={closeMobileFilter} className="flex-1 rounded-2xl bg-primary px-4 py-4 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-xl shadow-primary/20">View {filteredProducts.length} Results</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
