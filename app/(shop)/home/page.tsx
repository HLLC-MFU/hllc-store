import { getHomeContent } from "@/lib/backend/settings/settings-service";
import { getStoreProducts } from "@/lib/backend/products/store-display";
import { CATEGORIES } from "@/lib/config/catalog";
import { HomeClient } from "@/components/shop/home-client";
import type { CategoryBlock } from "@/components/shop/category-blocks";

// Always read fresh content so admin banner edits show up immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, allProducts] = await Promise.all([getHomeContent(), getStoreProducts()]);

  const blocks: CategoryBlock[] = CATEGORIES.map((category) => {
    const block = content.blocks[category.id];

    // For leaf categories (no groups), jump directly to the product when there is only one.
    let href = `/c/${category.id}`;
    if (!category.groups) {
      const categoryProducts = allProducts.filter((p) => p.category === category.id && !p.group);
      if (categoryProducts.length === 1) {
        href = `/products/${categoryProducts[0].id}`;
      }
    }

    return {
      href,
      imageUrl: block?.imageUrl || undefined,
      title: block?.title ?? category.label,
      subtitle: block?.subtitle,
    };
  });

  return <HomeClient blocks={blocks} />;
}
