import React from "react";
import type { Metadata } from "next";
import { createProductHref, formatProductNameForPath } from "@/app/data/products";
import { fetchBackendProductById } from "@/app/lib/backendProducts";
import ProductPageClient from "./components/ProductPageClient";

type ProductPageProps = {
  params: Promise<{ id: string; name?: string }>;
};

const SITE_URL = "https://gramansh.com";

const PRODUCT_SEO = {
  oil: {
    title: "Buy Cold Press Oil Online - Gram Ansh",
    description:
      "Shop Gram Ansh cold press oils made for clean, everyday cooking with a natural, ingredient-first approach.",
    keywords: ["gram ansh oil", "cold press oil online", "natural cooking oil"],
  },
  masala: {
    title: "Buy Natural Masala Online - Gram Ansh",
    description:
      "Discover Gram Ansh natural masalas crafted for rich flavor, clean ingredients, and reliable kitchen use.",
    keywords: ["gram ansh masala", "natural masala online", "traditional masala"],
  },
} satisfies Record<string, Pick<Metadata, "title" | "description" | "keywords">>;

function decodeRouteName(value?: string) {
  return decodeURIComponent(String(value || "").replace(/-/g, " ")).trim();
}

function getProductSeoKey(productName: string) {
  const normalized = productName.toLowerCase();
  if (
    normalized.includes("oil") ||
    normalized.includes("cold press") ||
    normalized.includes("mustard") ||
    normalized.includes("groundnut")
  ) {
    return "oil";
  }

  if (
    normalized.includes("masala") ||
    normalized.includes("spice") ||
    normalized.includes("powder")
  ) {
    return "masala";
  }

  return "";
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchBackendProductById(resolvedParams.id);
  const productName =
    product?.name || decodeRouteName(resolvedParams.name) || "Gram Ansh Product";
  const seoKey = getProductSeoKey(
    `${productName} ${formatProductNameForPath(productName)}`,
  );
  const matchedSeo = seoKey ? PRODUCT_SEO[seoKey as keyof typeof PRODUCT_SEO] : null;
  const canonicalPath = product
    ? createProductHref(product).split("?")[0]
    : `/product/${resolvedParams.id}/${resolvedParams.name || formatProductNameForPath(productName)}`;

  if (matchedSeo) {
    return {
      ...matchedSeo,
      title: `${productName} - Gram Ansh`,
      alternates: {
        canonical: `${SITE_URL}${canonicalPath}`,
      },
    };
  }

  return {
    title: `${productName} - Gram Ansh`,
    description: `Buy ${productName} online from Gram Ansh. Explore natural kitchen essentials crafted for clean everyday cooking.`,
    keywords: [productName, "gram ansh", "natural kitchen essentials"],
    alternates: {
      canonical: `${SITE_URL}${canonicalPath}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  return <ProductPageClient id={resolvedParams.id} name={resolvedParams.name} />;
}
