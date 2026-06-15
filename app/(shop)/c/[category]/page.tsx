import { notFound } from "next/navigation";
import { getStoreProducts } from "@/lib/backend/products/store-display";
import { getHomeContent } from "@/lib/backend/settings/settings-service";
import { getCategory, isCategoryId } from "@/lib/config/catalog";
import { CategoryGrid } from "@/components/shop/category-grid";
import { CategoryBlocks, type CategoryBlock } from "@/components/shop/category-blocks";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategoryId(category)) notFound();

  const def = getCategory(category);
  if (!def) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 md:px-6 py-4 pb-24">
        {def.groups ? (
          <GroupBlocks category={category} />
        ) : (
          <CategoryProductGrid category={category} />
        )}
      </div>
    </div>
  );
}

async function GroupBlocks({ category }: { category: string }) {
  const def = getCategory(category);
  const [content, allProducts] = await Promise.all([getHomeContent(), getStoreProducts()]);
  const blocks: CategoryBlock[] = (def?.groups ?? []).map((group) => {
    const block = content.blocks[group.id];

    // Jump directly to the product when the group has exactly one product and no charm filter.
    let href = `/c/${category}/${group.id}`;
    if (!group.hasCharmFilter) {
      const groupProducts = allProducts.filter(
        (p) => p.category === category && p.group === group.id,
      );
      if (groupProducts.length === 1) {
        href = `/products/${groupProducts[0].id}`;
      }
    }

    return {
      href,
      imageUrl: block?.imageUrl || undefined,
      title: block?.title ?? group.label,
      subtitle: block?.subtitle,
    };
  });
  return <CategoryBlocks blocks={blocks} />;
}

async function CategoryProductGrid({ category }: { category: string }) {
  const products = await getStoreProducts();
  const filtered = products.filter((p) => p.category === category && !p.group);
  return <CategoryGrid products={filtered} />;
}
