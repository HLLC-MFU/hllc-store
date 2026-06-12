import { listStoreProducts } from "./product-service";
import type { ShopProduct } from "@/components/shop/category-grid";

// Storefront display shape: the client grid fields plus taxonomy used for
// server-side filtering by category / group / charmType.
export type StoreProduct = ShopProduct & {
  category: string;
  group: string;
};

export async function getStoreProducts(): Promise<StoreProduct[]> {
  const products = await listStoreProducts();
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    options: (p.options ?? []).map((o) => ({ label: o.label, imageUrl: o.imageUrl, stock: o.stock })),
    imageUrl: p.imageUrl,
    category: p.category ?? "",
    group: p.group ?? "",
    charmType: p.charmType ?? "",
  }));
}
