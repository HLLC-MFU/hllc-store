// Flash Express special tourist/island areas — postal codes that incur the island surcharge.
// Sources: Flash Express official rate card + known island zip codes.
// Add or remove codes here to adjust coverage.

export const ISLAND_POSTAL_CODES: ReadonlySet<string> = new Set([
  // ภูเก็ต (ทั้งจังหวัด)
  "83000", "83100", "83110", "83120", "83130", "83140", "83150",
  // เกาะสมุย สุราษฎร์ธานี
  "84140", "84310", "84320", "84330",
  // เกาะพะงัน + เกาะเต่า สุราษฎร์ธานี
  "84280",
  // เกาะช้าง ตราด
  "23170",
  // เกาะเสม็ด ระยอง
  "21160",
  // เกาะลันตา กระบี่
  "81150",
  // เกาะยาว พังงา
  "82160",
]);

export function isIslandArea(postalCode?: string): boolean {
  if (!postalCode) return false;
  return ISLAND_POSTAL_CODES.has(postalCode.trim());
}
