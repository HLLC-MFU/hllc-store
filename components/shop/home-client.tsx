"use client";

import { CategoryBlocks, type CategoryBlock } from "./category-blocks";

type HomeClientProps = {
  blocks: CategoryBlock[];
};

export function HomeClient({ blocks }: HomeClientProps) {
  return (
    <div className="min-h-screen bg-white">
      <CategoryBlocks blocks={blocks} fullPage />
    </div>
  );
}
