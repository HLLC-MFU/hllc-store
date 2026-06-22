import { getHomeContent } from "@/lib/data/backend-ssr";
import { getStoreProducts } from "@/lib/data/store-products";
import { CATEGORIES } from "@hllc/shared/config/catalog";
import { HomeClient } from "@/components/shop/home-client";
import type { CategoryBlock } from "@/components/shop/category-blocks";

// Always read fresh content so admin banner edits show up immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, allProducts] = await Promise.all([getHomeContent(), getStoreProducts()]);

  const blocks: CategoryBlock[] = [];

  // Block 1: ขวดน้ำ — if only 1 product, skip category page and go direct
  const bottleCategory = CATEGORIES.find((c) => c.id === "bottle")!;
  const bottleBlock = content.blocks["bottle"];
  const bottleProducts = allProducts.filter((p) => p.category === "bottle" && !p.group);
  blocks.push({
    href: bottleProducts.length === 1 ? `/products/${bottleProducts[0].id}` : "/c/bottle",
    imageUrl: bottleBlock?.imageUrl || undefined,
    title: bottleBlock?.title ?? bottleCategory.label,
    subtitle: bottleBlock?.subtitle,
    hasSubBlocks: false,
  });

  // Block 3: Secret Set — same single-product shortcut logic
  // Block 2 (bracelet-charm overview) is hidden for now
  const secretGroup = CATEGORIES.find((c) => c.id === "bracelet-charm")
    ?.groups?.find((g) => g.id === "secret-set");
  const secretBlock = content.blocks["secret-set"];
  const secretProducts = allProducts.filter(
    (p) => p.category === "bracelet-charm" && p.group === "secret-set",
  );
  blocks.push({
    href: secretProducts.length === 1
      ? `/products/${secretProducts[0].id}`
      : "/c/bracelet-charm/secret-set",
    imageUrl: secretBlock?.imageUrl || undefined,
    title: secretBlock?.title ?? secretGroup?.label ?? { th: "Secret Set" },
    subtitle: secretBlock?.subtitle,
    hasSubBlocks: false,
  });

  return <HomeClient blocks={blocks} />;
}
