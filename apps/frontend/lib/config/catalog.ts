// Catalog taxonomy = the fixed 2-level shop structure (hardcoded by design).
// Admins do NOT create categories; they only tag a product into one "placement"
// (a leaf in this tree) via the product form. The storefront navigation and the
// banner content blocks are both keyed off the ids defined here.
//
// Tree:
//   bottle                         (top category, no groups → product grid)
//   bracelet-charm                 (top category, has groups → shows group blocks)
//     ├─ secret-set                (group → product grid)
//     ├─ bracelet                  (group → product grid)
//     └─ charm                     (group → product grid + clip/dangle filter)
//          ├─ clip   (ที่ lock)
//          └─ dangle (ที่ห้อย)

import type { LocalizedText } from "@hllc/shared";

export type CategoryId = "bottle" | "bracelet-charm";
export type GroupId = "secret-set" | "bracelet" | "charm";
export type CharmType = "clip" | "dangle" | "spacer";

// Block ids that have an editable banner (image + title + subtitle) in settings.
export type HomeBlockId = CategoryId | GroupId;

export type GroupDef = {
  id: GroupId;
  label: LocalizedText;
  subtitle?: LocalizedText;
  /** charm uses a clip/dangle filter on its grid */
  hasCharmFilter?: boolean;
};

export type CategoryDef = {
  id: CategoryId;
  label: LocalizedText;
  /** when present, the category landing shows these group blocks instead of a grid */
  groups?: GroupDef[];
};

export const CATEGORIES: CategoryDef[] = [
  {
    id: "bottle",
    label: { th: "ขวดน้ำ", en: "Water Bottle" },
  },
  {
    id: "bracelet-charm",
    label: { th: "สร้อยข้อมือพร้อม Charm", en: "Bracelet with Charm" },
    groups: [
      { id: "secret-set", label: { th: "Secret Set", en: "Secret Set" }, subtitle: { th: "Mystery bundle — bracelet + charm", en: "Mystery bundle — bracelet + charm" } },
      { id: "bracelet", label: { th: "Bracelet", en: "Bracelet" }, subtitle: { th: "Choose your bracelet color", en: "Choose your bracelet color" } },
      { id: "charm", label: { th: "Charms", en: "Charms" }, subtitle: { th: "Add charms individually", en: "Add charms individually" }, hasCharmFilter: true },
    ],
  },
];

export const CHARM_COLORS: { id: string; label: { th: string; en: string }; hex: string }[] = [
  { id: "white",  label: { th: "ขาว",     en: "White"  }, hex: "#F5F2EF" },
  { id: "brown",  label: { th: "น้ำตาล", en: "Brown"  }, hex: "#8B6347" },
  { id: "green",  label: { th: "เขียว",   en: "Green"  }, hex: "#6BAE75" },
  { id: "pink",   label: { th: "ชมพู",    en: "Pink"   }, hex: "#F4A0BF" },
  { id: "black",  label: { th: "ดำ",      en: "Black"  }, hex: "#2C2C2C" },
  { id: "blue",   label: { th: "ฟ้า",     en: "Blue"   }, hex: "#6AB0DC" },
  { id: "gold",   label: { th: "ทอง",     en: "Gold"   }, hex: "#CBA135" },
];

export const CHARM_TYPES: { id: CharmType; label: LocalizedText }[] = [
  { id: "dangle", label: { th: "ที่ห้อย",  en: "Dangle"  } },
  { id: "spacer", label: { th: "ที่กั้น",  en: "Spacer"  } },
  { id: "clip",   label: { th: "ที่ล็อค",  en: "Clip-on" } },
];

// A "placement" is a single admin-facing choice that resolves to the trio of
// product fields {category, group, charmType}. The product form renders these
// as one dropdown.
export type Placement = {
  value: string;
  label: LocalizedText;
  category: CategoryId;
  group?: GroupId;
  charmType?: CharmType;
};

export const PLACEMENTS: Placement[] = [
  { value: "bottle", label: { th: "ขวดน้ำ", en: "Water Bottle" }, category: "bottle" },
  {
    value: "secret-set",
    label: { th: "Secret Set", en: "Secret Set" },
    category: "bracelet-charm",
    group: "secret-set",
  },
  {
    value: "bracelet",
    label: { th: "สร้อยข้อมือพร้อมชาร์ม", en: "Bracelet with Charm" },
    category: "bracelet-charm",
    group: "bracelet",
  },
  {
    value: "charm-clip",
    label: { th: "Charm — ที่ล็อค", en: "Charm — Clip-on" },
    category: "bracelet-charm",
    group: "charm",
    charmType: "clip",
  },
  {
    value: "charm-dangle",
    label: { th: "Charm — ที่ห้อย", en: "Charm — Dangle" },
    category: "bracelet-charm",
    group: "charm",
    charmType: "dangle",
  },
  {
    value: "charm-spacer",
    label: { th: "Charm — ที่กั้น", en: "Charm — Spacer" },
    category: "bracelet-charm",
    group: "charm",
    charmType: "spacer",
  },
];

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
const GROUP_IDS: GroupId[] = ["secret-set", "bracelet", "charm"];
const CHARM_TYPE_IDS: CharmType[] = ["clip", "dangle", "spacer"];

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && (CATEGORY_IDS as string[]).includes(value);
}

export function isGroupId(value: unknown): value is GroupId {
  return typeof value === "string" && (GROUP_IDS as string[]).includes(value);
}

export function isCharmType(value: unknown): value is CharmType {
  return typeof value === "string" && (CHARM_TYPE_IDS as string[]).includes(value);
}

export function getCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getGroup(categoryId: string, groupId: string): GroupDef | undefined {
  return getCategory(categoryId)?.groups?.find((g) => g.id === groupId);
}

/** Resolve a product's stored fields to the matching placement (for the form). */
export function placementValue(category?: string, group?: string, charmType?: string): string {
  return (
    PLACEMENTS.find(
      (p) =>
        p.category === category &&
        (p.group ?? undefined) === (group || undefined) &&
        (p.charmType ?? undefined) === (charmType || undefined),
    )?.value ?? ""
  );
}

export function placementByValue(value: string): Placement | undefined {
  return PLACEMENTS.find((p) => p.value === value);
}

// Banner block ids that the admin can edit (top categories + groups).
export const HOME_BLOCK_IDS: HomeBlockId[] = [
  "bottle",
  "bracelet-charm",
  "secret-set",
  "bracelet",
  "charm",
];
