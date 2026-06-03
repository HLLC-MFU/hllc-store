import { listStoreProducts } from "@/lib/backend/products/product-service";
import { HomeClient } from "@/components/shop/home-client";

type ProductOption = {
  label: string;
  imageUrl?: string;
};

type LocalizedText = {
  th: string;
  en?: string;
};

type ApiProduct = {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  stock: number;
  category?: string;
  options?: Array<string | ProductOption>;
  imageUrl?: string;
  active: boolean;
};

type DisplayProduct = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  stock: number;
  category: string;
  options: ProductOption[];
  imageUrl?: string;
};

function normalizeCategory(category?: string) {
  const value = category?.trim().toLowerCase();

  if (!value) return "others";
  if (["umbrella", "umbrellas"].includes(value)) return "umbrella";
  if (["raincoat", "raincoats"].includes(value)) return "raincoat";
  if (["rainsuit", "rain-suit", "rain_suit"].includes(value)) return "rainsuit";
  if (["shoe", "shoes", "boot", "boots"].includes(value)) return "shoes";

  return value;
}

function normalizeOptions(options?: Array<string | ProductOption>) {
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      if (typeof option === "string") {
        return { label: option.trim(), imageUrl: "" };
      }

      return {
        label: option.label?.trim() ?? "",
        imageUrl: option.imageUrl?.trim() ?? "",
      };
    })
    .filter((option) => option.label);
}

function apiToDisplay(product: ApiProduct): DisplayProduct {
  const price = Number(product.price ?? 0);

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? { th: "" },
    price,
    stock: Number(product.stock ?? 0),
    category: normalizeCategory(product.category),
    options: normalizeOptions(product.options),
    imageUrl: product.imageUrl,
  };
}

export default async function HomePage() {
  const rawProducts = await listStoreProducts();

  // Transform products on server side
  const displayProducts = rawProducts
    .filter((p) => p.active !== false) // Only show active products
    .map((p) => apiToDisplay(p as unknown as ApiProduct));

  return <HomeClient products={displayProducts} />;
}
