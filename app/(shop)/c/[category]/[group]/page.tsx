import { notFound } from "next/navigation";
import { getStoreProducts } from "@/lib/backend/products/store-display";
import { getGroup, isCategoryId } from "@/lib/config/catalog";
import { CategoryGrid } from "@/components/shop/category-grid";
import { CharmGrid } from "@/components/shop/charm-grid";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string; group: string }> };

export default async function GroupPage({ params }: Props) {
  const { category, group } = await params;
  if (!isCategoryId(category)) notFound();

  const def = getGroup(category, group);
  if (!def) notFound();

  const products = await getStoreProducts();
  const filtered = products.filter((p) => p.category === category && p.group === group);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 md:px-6 py-4 pb-24">
        {def.hasCharmFilter ? (
          <CharmGrid products={filtered} />
        ) : (
          <CategoryGrid products={filtered} />
        )}
      </div>
    </div>
  );
}
