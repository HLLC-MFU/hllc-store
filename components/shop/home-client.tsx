"use client";

import { CategoryBlocks, type CategoryBlock } from "./category-blocks";

type HomeClientProps = {
  blocks: CategoryBlock[];
};

export function HomeClient({ blocks }: HomeClientProps) {
  return (
    <div className="fixed inset-0 top-14 md:top-0 md:left-56 lg:left-64 bg-white">
      <CategoryBlocks blocks={blocks} fullPage />
    </div>
  );
}
