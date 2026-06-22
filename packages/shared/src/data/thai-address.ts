// Full Thai administrative data (province → district → sub-district + zip),
// loaded lazily so the ~100KB gzipped dataset only ships on the checkout step.

export type SubDistrict = { th: string; en: string; zip: string };
export type District = { th: string; en: string; subDistricts: SubDistrict[] };
export type AddressProvince = { th: string; en: string; districts: District[] };

export type ZipMatch = {
  province: string;
  district: string;
  subDistrict: string;
  zip: string;
};

let cache: AddressProvince[] | null = null;
let zipIndex: Map<string, ZipMatch[]> | null = null;

export async function loadAddressData(): Promise<AddressProvince[]> {
  if (cache) return cache;
  const mod = await import("./thai-address.json");
  cache = (mod.default ?? mod) as unknown as AddressProvince[];
  return cache;
}

function buildZipIndex(data: AddressProvince[]): Map<string, ZipMatch[]> {
  const index = new Map<string, ZipMatch[]>();
  for (const province of data) {
    for (const district of province.districts) {
      for (const sub of district.subDistricts) {
        if (!sub.zip) continue;
        const match: ZipMatch = {
          province: province.th,
          district: district.th,
          subDistrict: sub.th,
          zip: sub.zip,
        };
        const list = index.get(sub.zip);
        if (list) list.push(match);
        else index.set(sub.zip, [match]);
      }
    }
  }
  return index;
}

/** All matching province/district/sub-district for a 5-digit postal code. */
export async function lookupByZip(zip: string): Promise<ZipMatch[]> {
  const data = await loadAddressData();
  if (!zipIndex) zipIndex = buildZipIndex(data);
  return zipIndex.get(zip) ?? [];
}

export function findProvince(data: AddressProvince[], th: string) {
  return data.find((p) => p.th === th);
}

export function findDistrict(province: AddressProvince | undefined, th: string) {
  return province?.districts.find((d) => d.th === th);
}

export function findSubDistrict(district: District | undefined, th: string) {
  return district?.subDistricts.find((s) => s.th === th);
}
