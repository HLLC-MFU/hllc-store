"use client";

import { CategoryBlocks, type CategoryBlock } from "./category-blocks";

type HomeClientProps = {
  blocks: CategoryBlock[];
};

export function HomeClient({ blocks }: HomeClientProps) {
  return (
    <div className="fixed inset-0 top-14 bg-white">
      <CategoryBlocks blocks={blocks} fullPage />
    </div>
  );
}
