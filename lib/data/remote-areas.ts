// Flash Express remote/special areas — detected by destination postal code
// (this is how Flash actually applies the remote-area surcharge).
// Source: https://wefastexpress.com/flash-express/flash-express-remote-areas/
// 49 postal codes across 10 provinces. Edit here if Flash updates the list.

export const REMOTE_POSTAL_CODES: ReadonlySet<string> = new Set([
  // เชียงใหม่ (ดอยเต่า, อมก๋อย, เวียงแหง, กัลยาณิวัฒนา)
  "50260", "50270", "50310", "50350",
  // น่าน (ทุ่งช้าง, เฉลิมพระเกียรติ, บ่อเกลือ)
  "55130", "55220",
  // แม่ฮ่องสอน (แม่สะเรียง, สบเมย, แม่ลาน้อย, ปาย, ขุนยวม, ปางมะผ้า)
  "58110", "58120", "58130", "58140", "58150",
  // ตาก (อุ้มผาง, ท่าสองยาง)
  "63150", "63170",
  // เพชรบูรณ์ (น้ำหนาว)
  "67260",
  // กาญจนบุรี (ทองผาภูมิ, สังขละบุรี)
  "71180", "71240",
  // พังงา (คุระบุรี)
  "82150",
  // ปัตตานี
  "94000", "94110", "94120", "94130", "94140", "94150", "94160", "94170",
  "94180", "94190", "94220", "94230",
  // ยะลา
  "95000", "95110", "95120", "95130", "95140", "95150", "95160", "95170",
  // นราธิวาส
  "96000", "96110", "96120", "96130", "96140", "96150", "96160", "96170",
  "96180", "96190", "96210", "96220",
]);

/** True when the destination postal code is a Flash Express remote area. */
export function isRemoteArea(postalCode?: string): boolean {
  if (!postalCode) return false;
  return REMOTE_POSTAL_CODES.has(postalCode.trim());
}
