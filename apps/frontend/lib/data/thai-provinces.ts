export type Province = {
  th: string;
  en: string;
  postalPrefix: string; // first 2 digits of postal codes in this province
};

export const THAI_PROVINCES: Province[] = [
  { th: "กรุงเทพมหานคร", en: "Bangkok",               postalPrefix: "10" },
  { th: "นนทบุรี",        en: "Nonthaburi",            postalPrefix: "11" },
  { th: "ปทุมธานี",       en: "Pathum Thani",          postalPrefix: "12" },
  { th: "พระนครศรีอยุธยา",en: "Phra Nakhon Si Ayutthaya", postalPrefix: "13" },
  { th: "อ่างทอง",        en: "Ang Thong",             postalPrefix: "14" },
  { th: "ลพบุรี",         en: "Lop Buri",              postalPrefix: "15" },
  { th: "สิงห์บุรี",      en: "Sing Buri",             postalPrefix: "16" },
  { th: "ชัยนาท",         en: "Chai Nat",              postalPrefix: "17" },
  { th: "สระบุรี",        en: "Saraburi",              postalPrefix: "18" },
  { th: "ชลบุรี",         en: "Chon Buri",             postalPrefix: "20" },
  { th: "ระยอง",          en: "Rayong",                postalPrefix: "21" },
  { th: "จันทบุรี",       en: "Chanthaburi",           postalPrefix: "22" },
  { th: "ตราด",           en: "Trat",                  postalPrefix: "23" },
  { th: "ฉะเชิงเทรา",     en: "Chachoengsao",          postalPrefix: "24" },
  { th: "ปราจีนบุรี",     en: "Prachin Buri",          postalPrefix: "25" },
  { th: "นครนายก",        en: "Nakhon Nayok",          postalPrefix: "26" },
  { th: "สระแก้ว",        en: "Sa Kaeo",               postalPrefix: "27" },
  { th: "สมุทรปราการ",    en: "Samut Prakan",          postalPrefix: "10" },
  { th: "นครราชสีมา",     en: "Nakhon Ratchasima",     postalPrefix: "30" },
  { th: "บุรีรัมย์",      en: "Buri Ram",              postalPrefix: "31" },
  { th: "สุรินทร์",       en: "Surin",                 postalPrefix: "32" },
  { th: "ศรีสะเกษ",       en: "Si Sa Ket",             postalPrefix: "33" },
  { th: "อุบลราชธานี",    en: "Ubon Ratchathani",      postalPrefix: "34" },
  { th: "ยโสธร",          en: "Yasothon",              postalPrefix: "35" },
  { th: "ชัยภูมิ",        en: "Chaiyaphum",            postalPrefix: "36" },
  { th: "อำนาจเจริญ",     en: "Amnat Charoen",         postalPrefix: "37" },
  { th: "บึงกาฬ",         en: "Bueng Kan",             postalPrefix: "38" },
  { th: "หนองบัวลำภู",    en: "Nong Bua Lam Phu",      postalPrefix: "39" },
  { th: "ขอนแก่น",        en: "Khon Kaen",             postalPrefix: "40" },
  { th: "อุดรธานี",       en: "Udon Thani",            postalPrefix: "41" },
  { th: "เลย",            en: "Loei",                  postalPrefix: "42" },
  { th: "หนองคาย",        en: "Nong Khai",             postalPrefix: "43" },
  { th: "มหาสารคาม",      en: "Maha Sarakham",         postalPrefix: "44" },
  { th: "ร้อยเอ็ด",       en: "Roi Et",                postalPrefix: "45" },
  { th: "กาฬสินธุ์",      en: "Kalasin",               postalPrefix: "46" },
  { th: "สกลนคร",         en: "Sakon Nakhon",          postalPrefix: "47" },
  { th: "นครพนม",         en: "Nakhon Phanom",         postalPrefix: "48" },
  { th: "มุกดาหาร",       en: "Mukdahan",              postalPrefix: "49" },
  { th: "เชียงใหม่",      en: "Chiang Mai",            postalPrefix: "50" },
  { th: "ลำพูน",          en: "Lamphun",               postalPrefix: "51" },
  { th: "ลำปาง",          en: "Lampang",               postalPrefix: "52" },
  { th: "อุตรดิตถ์",      en: "Uttaradit",             postalPrefix: "53" },
  { th: "แพร่",           en: "Phrae",                 postalPrefix: "54" },
  { th: "น่าน",           en: "Nan",                   postalPrefix: "55" },
  { th: "พะเยา",          en: "Phayao",                postalPrefix: "56" },
  { th: "เชียงราย",       en: "Chiang Rai",            postalPrefix: "57" },
  { th: "แม่ฮ่องสอน",     en: "Mae Hong Son",          postalPrefix: "58" },
  { th: "นครสวรรค์",      en: "Nakhon Sawan",          postalPrefix: "60" },
  { th: "อุทัยธานี",      en: "Uthai Thani",           postalPrefix: "61" },
  { th: "กำแพงเพชร",      en: "Kamphaeng Phet",        postalPrefix: "62" },
  { th: "ตาก",            en: "Tak",                   postalPrefix: "63" },
  { th: "สุโขทัย",        en: "Sukhothai",             postalPrefix: "64" },
  { th: "พิษณุโลก",       en: "Phitsanulok",           postalPrefix: "65" },
  { th: "พิจิตร",         en: "Phichit",               postalPrefix: "66" },
  { th: "เพชรบูรณ์",      en: "Phetchabun",            postalPrefix: "67" },
  { th: "ราชบุรี",        en: "Ratchaburi",            postalPrefix: "70" },
  { th: "กาญจนบุรี",      en: "Kanchanaburi",          postalPrefix: "71" },
  { th: "สุพรรณบุรี",     en: "Suphan Buri",           postalPrefix: "72" },
  { th: "นครปฐม",         en: "Nakhon Pathom",         postalPrefix: "73" },
  { th: "สมุทรสาคร",      en: "Samut Sakhon",          postalPrefix: "74" },
  { th: "สมุทรสงคราม",    en: "Samut Songkhram",       postalPrefix: "75" },
  { th: "เพชรบุรี",       en: "Phetchaburi",           postalPrefix: "76" },
  { th: "ประจวบคีรีขันธ์", en: "Prachuap Khiri Khan",  postalPrefix: "77" },
  { th: "นครศรีธรรมราช",  en: "Nakhon Si Thammarat",   postalPrefix: "80" },
  { th: "กระบี่",         en: "Krabi",                 postalPrefix: "81" },
  { th: "พังงา",          en: "Phang-nga",             postalPrefix: "82" },
  { th: "ภูเก็ต",         en: "Phuket",                postalPrefix: "83" },
  { th: "สุราษฎร์ธานี",   en: "Surat Thani",           postalPrefix: "84" },
  { th: "ระนอง",          en: "Ranong",                postalPrefix: "85" },
  { th: "ชุมพร",          en: "Chumphon",              postalPrefix: "86" },
  { th: "สงขลา",          en: "Songkhla",              postalPrefix: "90" },
  { th: "สตูล",           en: "Satun",                 postalPrefix: "91" },
  { th: "ตรัง",           en: "Trang",                 postalPrefix: "92" },
  { th: "พัทลุง",         en: "Phatthalung",           postalPrefix: "93" },
  { th: "ปัตตานี",        en: "Pattani",               postalPrefix: "94" },
  { th: "ยะลา",           en: "Yala",                  postalPrefix: "95" },
  { th: "นราธิวาส",       en: "Narathiwat",            postalPrefix: "96" },
];

export function getProvinceByPostal(postalCode: string): Province | undefined {
  const prefix = postalCode.slice(0, 2);
  return THAI_PROVINCES.find((p) => p.postalPrefix === prefix);
}

export function isPostalValidForProvince(postalCode: string, provinceTh: string): boolean {
  const province = THAI_PROVINCES.find((p) => p.th === provinceTh);
  if (!province) return true; // no province selected → skip
  return postalCode.startsWith(province.postalPrefix);
}
