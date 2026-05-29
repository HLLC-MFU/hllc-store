"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, ChevronLeft, Minus, Plus, Upload, X, Search } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export type OrderProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  gradient?: string;
  emoji?: string;
  imageUrl?: string;
};

type Step = 1 | 2 | 3 | "success";

type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

const PROVINCES = [
  "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น",
  "จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่",
  "ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช",
  "นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี",
  "ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา",
  "พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม",
  "มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี",
  "ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล",
  "สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี",
  "สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู",
  "อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี",
];

function ProvinceSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const filtered = PROVINCES.filter((p) =>
    p.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(""); }}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:border-[#85241F] outline-none transition-colors cursor-pointer"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || t("checkout.select_province")}
        </span>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("checkout.search_province")}
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{t("checkout.no_province")}</p>
            )}
            {filtered.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { onChange(p); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                  value === p
                    ? "bg-[#85241F]/8 text-[#85241F] font-medium"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                {p}
                {value === p && <span className="text-[#85241F] text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

const LOGISTICS_STEPS = [
  { th: "รอตรวจสลิป", en: "Reviewing slip" },
  { th: "จัดส่งแล้ว", en: "Shipped" },
  { th: "สำเร็จ", en: "Complete" },
];

function logisticsIndex(status: OrderStatus) {
  if (status === "completed") return 2;
  if (["paid", "packing", "shipped"].includes(status)) return 1;
  return 0;
}

function LogisticsStatusCard({
  status,
  lang,
}: {
  status: OrderStatus;
  lang: "th" | "en";
}) {
  const activeIndex = logisticsIndex(status);
  const complete = status === "completed";

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
        {lang === "th" ? "คำสั่งซื้อนี้ถูกยกเลิก" : "This order has been cancelled."}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
      <p className="text-[10px] font-black text-slate-800">
        {lang === "th" ? "การจัดส่ง (LOGISTICS)" : "LOGISTICS"}
      </p>
      <div className="mt-5 px-2">
        <div className="relative flex items-start justify-between">
          <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200" />
          <div
            className="absolute left-4 top-3 h-0.5 bg-[#96231F] transition-all duration-500"
            style={{ width: activeIndex === 0 ? "0%" : activeIndex === 1 ? "50%" : "calc(100% - 2rem)" }}
          />
          {LOGISTICS_STEPS.map((step, index) => {
            const active = index <= activeIndex;

            return (
              <div key={step.en} className="relative z-10 flex w-20 flex-col items-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${
                    active ? "bg-[#96231F]" : "bg-gray-300"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`mt-2 text-center text-[9px] font-black ${active ? "text-slate-800" : "text-gray-400"}`}>
                  {lang === "th" ? step.th : step.en}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {complete ? (
        <div className="mt-5 border-t border-gray-100 pt-3">
          <p className="flex items-center gap-2 text-sm font-black text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {lang === "th" ? "คำสั่งซื้อเสร็จสิ้นแล้ว" : "Order completed"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StepBar({ step }: { step: Step }) {
  const { t } = useLanguage();
  if (step === "success") return null;
  const current = step as 1 | 2 | 3;
  
  const STEPS = [
    { key: "checkout.step.product", label: "สินค้า" },
    { key: "checkout.step.payment", label: "ชำระเงิน" },
    { key: "checkout.step.info", label: "ข้อมูล" }
  ];

  return (
    <div className="flex items-center justify-center gap-2 py-3 border-b border-gray-100">
      {STEPS.map((sObj, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = current > n;
        const active = current === n;
        return (
          <div key={sObj.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  done
                    ? "bg-[#85241F] text-white"
                    : active
                    ? "bg-[#85241F] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={`text-xs font-semibold ${
                  active ? "text-[#85241F] font-bold" : done ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {t(sObj.key)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronLeft className="w-3 h-3 text-gray-300 rotate-180 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrderSheet({
  product,
  onClose,
}: {
  product: OrderProduct | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [qty, setQty] = useState(1);
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "pickup">("delivery");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupName, setPickupName] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<string | null>(null);
  const [slipSent, setSlipSent] = useState(false);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { lang, t } = useLanguage();

  async function fetchOrderStatus() {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/backend/orders/${orderId}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.data) {
          setOrderDetail(payload.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (step === "success" && orderId) {
      fetchOrderStatus();
      const interval = setInterval(fetchOrderStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [step, orderId]);

  useEffect(() => {
    if (product) {
      setStep(1);
      setQty(1);
      setDeliveryMode("delivery");
      setFirstName(""); setLastName("");
      setStreetAddress(""); setDistrict("");
      setProvince(""); setPostalCode("");
      setPhone("");
      setPickupName(""); setPickupTime(""); setPickupPhone("");
      setError("");
      setOrderId("");
      setSlipPreview(null);
      setSlipFile(null);
      setSlipSent(false);
      setOrderDetail(null);
    }
  }, [product]);

  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  if (!product) return null;

  const total = product.price * qty;

  async function handleCreateOrder() {
    if (!product) return;
    const isPickup = deliveryMode === "pickup";
    if (isPickup) {
      if (!pickupName.trim() || !pickupTime.trim() || pickupPhone.replace(/\D/g, "").length < 9) {
        setError(t("checkout.error.fill_fields"));
        return;
      }
    } else {
      const rawPhone = phone.replace(/\D/g, "");
      if (!firstName.trim() || !lastName.trim() || !streetAddress.trim() ||
          !district.trim() || !province || !postalCode.trim() || rawPhone.length < 9) {
        setError(t("checkout.error.fill_fields"));
        return;
      }
    }
    setLoading(true);
    setError("");
    const fullName = isPickup ? pickupName.trim() : `${firstName.trim()} ${lastName.trim()}`;
    const rawPhone = isPickup ? pickupPhone.replace(/\D/g, "") : phone.replace(/\D/g, "");
    const fullAddress = isPickup
      ? `รับเองที่ D1 — เวลา ${pickupTime.trim()}`
      : `${streetAddress.trim()}, ${district.trim()}, ${province} ${postalCode.trim()}`;
    try {
      const res = await fetch("/api/backend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: fullName, phone: rawPhone, address: fullAddress },
          items: [{ productId: product.id, quantity: qty }],
        }),
      });
      const payload = await res.json();
      
      let finalOrderId = "";
      if (!res.ok) {
        // demo mode
        finalOrderId = "DEMO" + Math.random().toString(36).slice(2, 8).toUpperCase();
      } else {
        finalOrderId = payload.data?.id ?? "";
      }
      setOrderId(finalOrderId);

      // Immediately send the uploaded payment slip
      if (slipFile && finalOrderId) {
        try {
          await fetch(`/api/backend/orders/${finalOrderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: slipFile, amount: total }),
          });
          setSlipSent(true);
        } catch (err) {
          console.error("Failed to upload slip:", err);
        }
      }

      setStep("success");
    } catch {
      const mockId = "DEMO" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setOrderId(mockId);
      setStep("success");
    }
    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setSlipPreview(result);
      setSlipFile(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Header — logo only */}
      <div className="flex items-center justify-between px-5 pt-10 pb-2 shrink-0">
        <button
          onClick={step === 1 ? onClose : () => setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 1) as Step)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-9 w-auto object-contain" />
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <StepBar step={step} />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Step 1: สินค้า ── */}
        {step === 1 && (
          <div className="px-5 pt-5 pb-8 flex flex-col gap-5">
            {/* Product row */}
            <div className="flex gap-4">
              <div className={`w-20 h-20 rounded-2xl shrink-0 overflow-hidden ${!product.imageUrl ? `bg-linear-to-br ${product.gradient ?? "from-[#85241F] to-[#5A1710]"}` : ""} flex items-center justify-center`}>
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{product.emoji ?? "📦"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 leading-tight">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
                <p className="text-[#85241F] font-black mt-1">{money(product.price)}</p>
              </div>
            </div>

            {/* Qty */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">{t("checkout.qty")}</span>
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-1.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-bold w-6 text-center tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="flex justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium">{t("checkout.shipping")}</span>
                <span className="text-sm text-green-600 font-bold">{t("checkout.shipping.free")}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-gray-50">
                <span className="text-sm font-bold text-gray-900">{t("checkout.total")}</span>
                <div className="text-right">
                  <span className="text-base font-black text-gray-900">{money(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: ชำระเงิน ── */}
        {step === 2 && (
          <div className="px-5 pt-5 pb-8 flex flex-col gap-5">
            {/* Order summary */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs text-[#85241F] mb-1 font-extrabold uppercase tracking-wider">{t("checkout.step.payment")}</p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-600 font-medium">{product.name} × {qty}</span>
                <span className="font-bold">{money(total)}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <p className="text-sm font-bold text-gray-800 mb-3">{t("checkout.scan_qr")}</p>
              <div className="w-52 h-52 border-2 border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/qr-payment.png"
                  alt="QR Payment"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden flex-col items-center gap-2 text-gray-300">
                  <span className="text-4xl">📱</span>
                  <span className="text-[10px] text-center px-4">Place QR Code at<br />/public/images/qr-payment.png</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {t("checkout.payment_amount")} <span className="font-black text-[#85241F] text-sm">{money(total)}</span>
              </p>
            </div>

            {/* Slip upload */}
            <div>
              <p className="text-sm font-bold text-gray-800 mb-3">{t("checkout.upload_slip")}</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {slipPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slipPreview} alt="slip" className="w-full max-h-52 object-contain rounded-2xl border border-gray-200" />
                  <button
                    onClick={() => { setSlipPreview(null); setSlipFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-[#85241F]/40 transition-colors cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-gray-400 animate-bounce" />
                  <span className="text-sm text-gray-400 font-medium">{t("checkout.upload_tap")}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: ข้อมูลจัดส่ง ── */}
        {step === 3 && (
          <div className="px-5 pt-5 pb-8 flex flex-col gap-3">
            <h2 className="text-base font-bold text-gray-900 mb-1">{t("checkout.delivery_method")}</h2>

            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-1">
              {(["delivery", "pickup"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setDeliveryMode(mode); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    deliveryMode === mode
                      ? "bg-white text-[#85241F] shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {mode === "delivery" ? t("checkout.method.delivery") : t("checkout.method.pickup")}
                </button>
              ))}
            </div>

            {/* ── Pickup form ── */}
            {deliveryMode === "pickup" && (
              <>
                <div className="flex items-center gap-2.5 bg-[#85241F]/6 border border-[#85241F]/20 rounded-xl px-4 py-3 mb-1">
                  <span className="text-lg shrink-0">📍</span>
                  <div>
                    <p className="text-sm font-bold text-[#85241F]">{t("checkout.pickup.location")}</p>
                    <p className="text-xs text-gray-500 font-medium">{t("checkout.pickup.sub")}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.pickup.name")}</label>
                  <input value={pickupName} onChange={(e) => setPickupName(e.target.value)}
                    placeholder={lang === "th" ? "ชื่อ-นามสกุล" : "Firstname Lastname"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.pickup.time")}</label>
                  <input value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}
                    placeholder={lang === "th" ? "เช่น 14:00 น." : "e.g. 2:00 PM"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.phone")}</label>
                  <input value={pickupPhone} onChange={(e) => setPickupPhone(formatPhone(e.target.value))}
                    placeholder="099-999-9999"
                    type="tel" inputMode="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                </div>
              </>
            )}

            {/* ── Delivery form ── */}
            {deliveryMode === "delivery" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.firstname")}</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder={lang === "th" ? "ชื่อ" : "First Name"}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.lastname")}</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder={lang === "th" ? "นามสกุล" : "Last Name"}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.address")}</label>
                  <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder={lang === "th" ? "เช่น 123 ถ.สุขุมวิท แขวงคลองเตย" : "e.g. 123 Sukhumvit Rd, Khlong Toei"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.district")}</label>
                  <input value={district} onChange={(e) => setDistrict(e.target.value)}
                    placeholder={lang === "th" ? "เขต/อำเภอ" : "District / Amphoe"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.province")}</label>
                  <ProvinceSelect value={province} onChange={setProvince} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.postal")}</label>
                  <input value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="10110" inputMode="numeric"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold">{t("checkout.label.phone")}</label>
                  <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="099-999-9999" type="tel" inputMode="tel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#85241F] transition-colors" />
                </div>
                <div className="border border-[#85241F]/30 bg-[#85241F]/4 rounded-2xl px-4 py-3 flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#85241F] flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{t("checkout.free_shipping_banner")}</span>
                  </div>
                  <span className="text-sm font-black text-green-600">{t("checkout.shipping.free")}</span>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm font-semibold text-[#85241F] bg-[#85241F]/8 rounded-xl px-4 py-3 text-center">{error}</p>
            )}
          </div>
        )}

        {/* ── Success/Order Status ── */}
        {step === "success" && (
          <div className="px-5 pt-3 pb-8 flex flex-col gap-5 max-w-xl mx-auto animate-in fade-in duration-300">
            {/* Header Success info */}
            <div className="text-center flex flex-col items-center py-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mb-3 text-2xl shadow-xs animate-pulse">
                ✓
              </div>
              <h2 className="text-base font-black text-gray-900">{t("checkout.success.title")}</h2>
              <p className="text-[10px] text-gray-400 mt-1 font-mono font-black">ORDER ID: #{orderId.slice(-8).toUpperCase()}</p>
            </div>

            <LogisticsStatusCard
              status={(orderDetail?.status || (slipSent ? "payment_review" : "pending_payment")) as OrderStatus}
              lang={lang}
            />

            {/* Stepper timeline */}
            {(() => {
              const currentStatus = orderDetail?.status || (slipSent ? "payment_review" : "pending_payment");
              
              const timelineSteps: { key: OrderStatus; labelTH: string; labelEN: string }[] = [
                { key: "payment_review", labelTH: "รอตรวจสลิป", labelEN: "Reviewing Slip" },
                { key: "paid", labelTH: "ชำระแล้ว / เตรียมของ", labelEN: "Paid / Packing" },
                { key: "shipped", labelTH: "จัดส่งแล้ว", labelEN: "Shipped" },
                { key: "completed", labelTH: "เสร็จสิ้น", labelEN: "Completed" }
              ];
              
              const currentIdx = timelineSteps.findIndex(s => s.key === currentStatus || (s.key === "paid" && currentStatus === "packing"));
              const isCancelled = currentStatus === "cancelled";

              if (isCancelled) {
                return (
                  <div className="hidden">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-bold text-red-950">{lang === "th" ? "คำสั่งซื้อถูกยกเลิก" : "Order Cancelled"}</p>
                      <p className="text-[10px] text-red-600/80 mt-0.5">{lang === "th" ? "คำสั่งซื้อนี้ถูกยกเลิกแล้วโดยผู้ดูแลระบบ" : "This order has been cancelled by administrator."}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="hidden">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">{lang === "th" ? "สถานะการจัดส่ง" : "Logistics Status"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between relative px-2 py-1">
                    {/* Stepper line */}
                    <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-gray-100 z-0" />
                    <div 
                      className="absolute top-3.5 left-6 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                      style={{ width: `${currentIdx <= 0 ? 0 : (currentIdx / (timelineSteps.length - 1)) * 88}%` }}
                    />
                    
                    {timelineSteps.map((stepItem, idx) => {
                      const done = idx < currentIdx || currentStatus === "completed";
                      const active = idx === currentIdx;
                      
                      return (
                        <div key={stepItem.key} className="flex flex-col items-center z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-[9px] shadow-2xs ${
                            done ? "bg-emerald-500 border-emerald-500 text-white" :
                            active ? "bg-white border-[#85241F] text-[#85241F] scale-110 ring-4 ring-[#85241F]/5" :
                            "bg-white border-gray-100 text-gray-300"
                          }`}>
                            {done ? "✓" : idx + 1}
                          </div>
                          <span className={`text-[7.5px] font-bold mt-2 text-center max-w-[65px] leading-tight block ${
                            active ? "text-[#85241F] font-black" : done ? "text-emerald-600" : "text-gray-400"
                          }`}>
                            {lang === "th" ? stepItem.labelTH : stepItem.labelEN}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Receipt Summary details */}
            <div className="bg-linear-to-br from-amber-50/20 to-amber-100/10 border-2 border-dashed border-amber-200/60 rounded-3xl p-5 shadow-3xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-amber-200/40 pb-2 mb-3">
                  <span className="text-amber-800 text-[9px] font-black uppercase tracking-wider">
                    {deliveryMode === "pickup" ? t("admin.order.pickup_label") : t("admin.order.shipping_label")}
                  </span>
                  <span className="text-[8px] text-amber-500 font-bold font-mono">CODE: #{orderId.slice(-6).toUpperCase()}</span>
                </div>
                
                <div className="text-xs text-gray-700 space-y-2.5 leading-relaxed font-semibold">
                  <div>
                    <span className="text-[8.5px] text-gray-400 block mb-0.5">{deliveryMode === "pickup" ? t("admin.order.pickup_details") : t("admin.order.address")}</span>
                    <p className="text-gray-800 leading-relaxed border-l-2 border-amber-300 pl-2">
                      {deliveryMode === "pickup" 
                        ? `รับเองที่ D1 — เวลา ${pickupTime.trim()}`
                        : `${streetAddress.trim()}, ${district.trim()}, ${province} ${postalCode.trim()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 border-t border-amber-200/10 pt-2">
                    <span className="text-[8.5px] text-gray-400 shrink-0">{t("admin.order.phone")}</span>
                    <span className="text-gray-700 font-mono">{deliveryMode === "pickup" ? pickupPhone : phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items detail */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-3xl p-4 flex flex-col gap-2">
              <span className="text-[8.5px] text-gray-400 font-bold uppercase tracking-wider">{t("admin.order.item")}</span>
              <div className="flex justify-between items-center text-xs text-gray-800 font-bold">
                <span>{product.name} × {qty}</span>
                <span className="text-[#85241F] font-black">{money(total)}</span>
              </div>
            </div>


          </div>
        )}
      </div>

      {/* ── Footer button ── */}
      {step !== "success" && (
        <div className="shrink-0 px-5 pb-8 pt-4 border-t border-gray-100 bg-white">
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#85241F] text-white font-bold py-4 rounded-2xl text-sm hover:bg-[#B72D2A] transition-colors cursor-pointer shadow-lg shadow-[#85241F]/10 active:scale-98"
            >
              {t("checkout.continue")}
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              disabled={!slipFile}
              className="w-full bg-[#85241F] text-white font-bold py-4 rounded-2xl text-sm hover:bg-[#B72D2A] transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#85241F]/10 active:scale-98"
            >
              {t("checkout.continue")}
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full bg-[#85241F] text-white font-bold py-4 rounded-2xl text-sm hover:bg-[#B72D2A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#85241F]/10 active:scale-98"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-1 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t("checkout.creating_order")}
                </>
              ) : `${t("checkout.confirm_button")} · ${money(total)}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
