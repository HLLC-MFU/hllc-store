import { notFound, redirect } from "next/navigation";
import {
  ProductDetailView,
  type ProductDetailProduct,
} from "@/components/shop/product-detail-view";
import { listStoreProducts, getCharmSettings, getHomeContent } from "@/lib/data/backend-ssr";

// Always read fresh products so admin edits show up immediately (no build cache).
export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

function getBlockId(category: string | undefined, group?: string | null): string | null {
  if (!category) return null;
  if (category === "bottle") return "bottle";
  if (category === "bracelet-charm" && group === "secret-set") return "secret-set";
  return null;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const [products, charmSettings, content] = await Promise.all([
    listStoreProducts(),
    getCharmSettings().catch(() => ({ images: {} })),
    getHomeContent().catch(() => null),
  ]);
  const product = products.find((item) => item.id === productId);

  if (product && content) {
    const blockId = getBlockId(product.category, product.group);
    const blockStatus = blockId ? content.blocks[blockId]?.blockStatus : undefined;
    if (blockStatus === "closed") {
      redirect("/");
    }
  }

  if (!product) {
    notFound();
  }

  const blockId = getBlockId(product.category, product.group);
  const blockStatus = blockId && content ? content.blocks[blockId]?.blockStatus : undefined;
  const comingSoon = blockStatus === "comingSoon" || product.comingSoon === true;

  const detailProduct: ProductDetailProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    options: product.options,
    allowCustomName: product.allowCustomName,
    customNameMaxLength: product.customNameMaxLength,
    charmImages: product.allowCustomName ? charmSettings.images : undefined,
    imageUrls: product.imageUrls,
    comingSoon,
  };

  return <ProductDetailView product={detailProduct} />;
}
