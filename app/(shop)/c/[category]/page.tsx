import { notFound } from "next/navigation";
import { getStoreProducts } from "@/lib/backend/products/store-display";
import { getCategory, isCategoryId } from "@/lib/config/catalog";
import { CategoryGrid, SingleProductCard, type LocalizedText } from "@/components/shop/category-grid";
import { CharmGrid } from "@/components/shop/charm-grid";
import { SectionLabel } from "@/components/shop/section-label";
import { BackButton } from "@/components/shop/back-button";
import { getHomeContent } from "@/lib/backend/settings/settings-service";
import type { HomeBlock } from "@/lib/modules/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategoryId(category)) notFound();

  const def = getCategory(category);
  if (!def) notFound();

  const [allProducts, homeContent] = await Promise.all([
    getStoreProducts(),
    getHomeContent().catch(() => ({ blocks: {} as Record<string, HomeBlock> })),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 md:px-6 py-4 pb-24">
        <BackButton />
        {def.groups ? (
          <GroupedSections category={category} groups={def.groups} allProducts={allProducts} homeBlocks={homeContent.blocks} />
        ) : (
          <CategoryGrid products={allProducts.filter((p) => p.category === category && !p.group)} />
        )}
      </div>
    </div>
  );
}

function labelFromBlock(block: HomeBlock | undefined, fallback: LocalizedText): LocalizedText {
  if (!block?.title?.th) return fallback;
  return { th: block.title.th, en: block.title.en };
}

function subtitleFromBlock(block: HomeBlock | undefined, fallback?: LocalizedText): LocalizedText | undefined {
  if (!block?.subtitle?.th) return fallback;
  return { th: block.subtitle.th, en: block.subtitle.en };
}

function GroupedSections({
  category,
  groups,
  allProducts,
  homeBlocks,
}: {
  category: string;
  groups: NonNullable<ReturnType<typeof getCategory>>["groups"];
  allProducts: Awaited<ReturnType<typeof getStoreProducts>>;
  homeBlocks: Record<string, HomeBlock>;
}) {
  const sections = (groups ?? [])
    .map((group) => ({
      group,
      products: allProducts.filter((p) => p.category === category && p.group === group.id),
    }))
    .filter((s) => s.products.length > 0);

  const bannerSections = sections.filter(s => !s.group.hasCharmFilter);
  const charmSection   = sections.find(s => s.group.hasCharmFilter);

  return (
    <div className="flex flex-col gap-8">
      {/* Secret Set + Bracelet — 2 columns on desktop */}
      {bannerSections.length > 0 && (
        <div className={bannerSections.length >= 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" : ""}>
          {bannerSections.map((section, idx) => (
            <div key={section.group.id} className="contents">
              {idx > 0 && (
                <div className="flex items-center gap-3 md:hidden">
                  <div className="flex-1 h-px bg-gray-100" />
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-brand/30" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                    <div className="w-1 h-1 rounded-full bg-brand/30" />
                  </div>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
              <div className="flex flex-col">
                <SectionLabel
                  label={labelFromBlock(homeBlocks[section.group.id], section.group.label)}
                  subtitle={subtitleFromBlock(homeBlocks[section.group.id], section.group.subtitle)}
                />
                {section.products.length === 1 ? (
                  <SingleProductCard product={section.products[0]} />
                ) : (
                  <CategoryGrid products={section.products} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charm — full width */}
      {charmSection && (
        <>
          {bannerSections.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-brand/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                <div className="w-1 h-1 rounded-full bg-brand/30" />
              </div>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          )}
          <div>
            <SectionLabel
              label={labelFromBlock(homeBlocks[charmSection.group.id], charmSection.group.label)}
              subtitle={subtitleFromBlock(homeBlocks[charmSection.group.id], charmSection.group.subtitle)}
            />
            <CharmGrid products={charmSection.products} />
          </div>
        </>
      )}
    </div>
  );
}
