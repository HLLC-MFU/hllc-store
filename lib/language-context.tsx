"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "th" | "en";

interface TranslationDict {
  [key: string]: {
    th: string;
    en: string;
  };
}

const DICTIONARY: TranslationDict = {
  // Navigation
  "nav.home": { th: "หน้าหลัก", en: "Home" },
  "nav.cart": { th: "ตะกร้า", en: "Cart" },
  "nav.profile": { th: "โปรไฟล์", en: "Profile" },
  "nav.guest": { th: "ผู้ใช้ทั่วไป", en: "Guest User" },
  "nav.store": { th: "ร้านค้า", en: "Store" },

  // Select Index Page
  "select.title": { th: "HLLC สโตร์", en: "HLLC Store" },
  "select.subtitle": { th: "กรุณาเลือกช่องทางที่คุณต้องการไป", en: "Choose where you want to go." },
  "select.home": { th: "เข้าสู่หน้าหลักร้านค้า", en: "Go to Shop Home" },
  "select.admin": { th: "เข้าสู่ระบบหลังบ้าน", en: "Go to Admin Dashboard" },

  // Shop Home Page
  "shop.search_placeholder": { th: "ค้นหาสินค้า...", en: "Search products..." },
  "shop.all_products": { th: "สินค้าทั้งหมด", en: "All Products" },
  "shop.items_count": { th: "รายการ", en: "items" },
  "shop.no_results": { th: "ไม่พบสินค้าที่ค้นหา", en: "No products found for search" },
  "shop.no_category": { th: "ไม่มีสินค้าในหมวดนี้", en: "No products in this category" },
  "shop.out_of_stock": { th: "สินค้าหมด", en: "Out of Stock" },
  "shop.order_now": { th: "สั่งซื้อเลย", en: "Order Now" },
  "shop.categories": { th: "หมวดหมู่", en: "Categories" },
  "shop.cat.umbrella": { th: "ร่ม", en: "Umbrella" },
  "shop.cat.raincoat": { th: "เสื้อกันฝน", en: "Raincoat" },
  "shop.cat.rainsuit": { th: "ชุดกันฝน", en: "Rain Suit" },
  "shop.cat.shoes": { th: "รองเท้า", en: "Shoes" },
  "shop.cat.others": { th: "อื่นๆ", en: "Others" },

  // Order Sheet Steps
  "checkout.step.product": { th: "สินค้า", en: "Product" },
  "checkout.step.info": { th: "ข้อมูล", en: "Info" },
  "checkout.step.payment": { th: "ชำระเงิน", en: "Payment" },
  
  // Order Sheet Step 1
  "checkout.qty": { th: "จำนวน", en: "Quantity" },
  "checkout.shipping": { th: "ค่าจัดส่ง", en: "Shipping Cost" },
  "checkout.shipping.free": { th: "ฟรี", en: "FREE" },
  "checkout.total": { th: "ยอดรวม", en: "Total" },
  "checkout.continue": { th: "ดำเนินการต่อ", en: "Continue" },

  // Order Sheet Step 2
  "checkout.delivery_method": { th: "วิธีรับสินค้า", en: "Delivery Method" },
  "checkout.method.delivery": { th: "จัดส่ง", en: "Delivery" },
  "checkout.method.pickup": { th: "รับเอง", en: "Self Pickup" },
  "checkout.pickup.location": { th: "รับที่ D1", en: "Pick up at D1" },
  "checkout.pickup.sub": { th: "กรุณาแจ้งชื่อ เวลา และเบอร์ติดต่อ", en: "Please notify name, time, and contact info" },
  "checkout.label.firstname": { th: "*ชื่อ", en: "*First Name" },
  "checkout.label.lastname": { th: "*นามสกุล", en: "*Last Name" },
  "checkout.label.address": { th: "*บ้านเลขที่, อาคาร, หมู่, ถนน, แขวง/ตำบล", en: "*Address, Building, Village, Street, Sub-district" },
  "checkout.label.district": { th: "*เขต/อำเภอ", en: "*District / Amphoe" },
  "checkout.label.province": { th: "จังหวัด", en: "Province" },
  "checkout.label.postal": { th: "รหัสไปรษณีย์", en: "Postal Code" },
  "checkout.label.phone": { th: "*เบอร์โทรศัพท์", en: "*Phone Number" },
  "checkout.free_shipping_banner": { th: "ฟรีค่าจัดส่ง (1–3 วัน)", en: "Free Shipping (1-3 Days)" },
  "checkout.pickup.name": { th: "*ชื่อผู้รับ", en: "*Recipient Name" },
  "checkout.pickup.time": { th: "*เวลาที่จะมารับ", en: "*Pickup Time" },
  "checkout.error.fill_fields": { th: "กรุณากรอกข้อมูลให้ครบถ้วน", en: "Please fill in all required fields" },
  "checkout.confirm_button": { th: "ยืนยันคำสั่งซื้อ", en: "Confirm Order" },
  "checkout.creating_order": { th: "กำลังสร้างคำสั่งซื้อ...", en: "Creating order..." },
  "checkout.select_province": { th: "เลือกจังหวัด", en: "Select Province" },
  "checkout.search_province": { th: "ค้นหาจังหวัด...", en: "Search province..." },
  "checkout.no_province": { th: "ไม่พบจังหวัด", en: "No province found" },

  // Order Sheet Step 3
  "checkout.order_id": { th: "หมายเลขคำสั่งซื้อ", en: "Order Number" },
  "checkout.scan_qr": { th: "สแกน QR Code เพื่อชำระเงิน", en: "Scan QR Code for Payment" },
  "checkout.payment_amount": { th: "ยอดชำระ", en: "Payment Amount" },
  "checkout.upload_slip": { th: "อัพโหลดสลิปหลังโอนเงิน", en: "Upload slip after transfer" },
  "checkout.upload_tap": { th: "แตะเพื่ออัพโหลดสลิป", en: "Tap to upload payment slip" },
  "checkout.confirm_payment": { th: "ยืนยันการโอนเงิน", en: "Confirm Payment" },
  "checkout.sending": { th: "กำลังส่ง...", en: "Sending..." },

  // Order Sheet Success
  "checkout.success.title": { th: "สั่งซื้อสำเร็จ!", en: "Order Successful!" },
  "checkout.success.slip_sent": { th: "ส่งสลิปเรียบร้อย ทีมงานจะตรวจสอบโดยเร็ว", en: "Slip submitted! Our team will verify it shortly." },
  "checkout.success.no_slip": { th: "กรุณาส่งสลิปการโอนเงินให้ทีมงาน", en: "Please submit your payment slip to the team." },
  "checkout.success.back": { th: "กลับไปเลือกสินค้า", en: "Back to Shop" },

  // Admin Login
  "admin.login.title": { th: "เข้าสู่ระบบผู้ดูแลระบบ", en: "Admin Login Portal" },
  "admin.login.subtitle": { th: "กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อเข้าจัดการสโตร์ HLLC", en: "Please sign in with your administrator account to manage HLLC Store" },
  "admin.login.username": { th: "ชื่อผู้ใช้", en: "Username" },
  "admin.login.password": { th: "รหัสผ่าน", en: "Password" },
  "admin.login.button": { th: "เข้าสู่ระบบหลังบ้าน", en: "Sign In as Admin" },
  "admin.login.error": { th: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", en: "Invalid username or password" },
  "admin.login.desc": { th: "เซสชันผู้ดูแลระบบถูกเก็บด้วยคุกกี้ที่ปลอดภัยกว่าเดิม", en: "Admin sessions are stored with a more secure cookie." },

  // Admin Header
  "admin.header": { th: "HLLC หลังบ้าน", en: "HLLC Admin Portal" },
  "admin.pending_badge": { th: "รอตรวจ {count} รายการ", en: "Pending {count} reviews" },
  "admin.stats_summary": { th: "{orders} คำสั่งซื้อ · {products} สินค้า", en: "{orders} orders · {products} products" },
  "admin.tab.orders": { th: "คำสั่งซื้อ", en: "Orders" },
  "admin.tab.products": { th: "สินค้า", en: "Products" },

  // Admin Stats Grid
  "admin.stats.revenue": { th: "ยอดขายรวม", en: "Total Revenue" },
  "admin.stats.pending": { th: "สลิปที่รอตรวจ", en: "Pending Slips" },
  "admin.stats.active": { th: "กำลังดำเนินการ", en: "Active Shipments" },
  "admin.stats.completed": { th: "เสร็จสิ้น", en: "Completed Orders" },

  // Admin Orders Tab
  "admin.orders.pending_review": { th: "รอตรวจสลิป ({count})", en: "Pending Slip Review ({count})" },
  "admin.orders.all": { th: "คำสั่งซื้อทั้งหมด", en: "All Orders" },
  "admin.orders.search_placeholder": { th: "ค้นหาด้วยชื่อ, เบอร์โทร หรือออเดอร์ไอดี...", en: "Search by customer name, phone, or order ID..." },
  "admin.orders.filter_all": { th: "ทั้งหมด", en: "All" },
  "admin.orders.filter_delivery": { th: "จัดส่ง", en: "Delivery" },
  "admin.orders.filter_pickup": { th: "รับเอง", en: "Pickup" },
  "admin.orders.empty": { th: "ไม่มีคำสั่งซื้อ", en: "No orders found" },

  // Admin Slip Review Card
  "admin.slip.view": { th: "ดูรูป", en: "View Slip" },
  "admin.slip.approve": { th: "อนุมัติ", en: "Approve" },
  "admin.slip.reject": { th: "ปฏิเสธ", en: "Reject" },

  // Admin Order Row & Stepper
  "admin.status.pending_payment": { th: "รอชำระเงิน", en: "Pending Payment" },
  "admin.status.payment_review": { th: "รอยืนยันชำระ", en: "Confirming payment" },
  "admin.status.paid": { th: "ชำระเงินแล้ว", en: "Paid" },
  "admin.status.packing": { th: "เตรียมจัดส่ง", en: "Preparing" },
  "admin.status.shipped": { th: "จัดส่งแล้ว", en: "Shipped" },
  "admin.status.completed": { th: "ส่งสำเร็จ", en: "Delivered" },
  "admin.status.cancelled": { th: "ยกเลิกแล้ว", en: "Cancelled" },

  "admin.order.shipping_label": { th: "ใบจ่าหน้าพัสดุ", en: "Shipping Label" },
  "admin.order.pickup_label": { th: "ข้อมูลการรับเอง", en: "Pickup Label" },
  "admin.order.address": { th: "ที่อยู่จัดส่ง", en: "Shipping Address" },
  "admin.order.pickup_details": { th: "รายละเอียดการรับเอง", en: "Self-Pickup Details" },
  "admin.order.phone": { th: "เบอร์โทรศัพท์", en: "Phone Number" },
  "admin.order.slip_status": { th: "สถานะสลิป", en: "Slip Status" },
  "admin.order.change_status": { th: "เปลี่ยนสถานะคำสั่งซื้อ", en: "Update Order Status" },
  "admin.order.next_stage": { th: "ดำเนินการขั้นถัดไป", en: "Proceed to Next Stage" },
  "admin.order.prev_stage": { th: "ย้อนกลับไปสถานะ", en: "Back to Stage" },
  "admin.order.is_completed": { th: "คำสั่งซื้อเสร็จสิ้นแล้ว", en: "Order is completed!" },
  "admin.order.item": { th: "รายการสินค้า", en: "Items list" },

  // Admin Modals
  "admin.modal.approve_title": { th: "ยืนยันการอนุมัติ?", en: "Confirm Approval?" },
  "admin.modal.reject_title": { th: "สลิปไม่ผ่าน?", en: "Reject Slip?" },
  "admin.modal.approve_desc": { th: "สลิปจะถูกอนุมัติ และสถานะออเดอร์จะเปลี่ยนเป็น 'ชำระแล้ว'", en: "Slip will be approved and order status will change to 'Paid'" },
  "admin.modal.reject_desc": { th: "ระบบจะแจ้งลูกค้าว่าสลิปไม่ผ่าน และให้ส่งหลักฐานการโอนใหม่", en: "Customer will be notified that the slip was rejected and asked to resubmit" },
  "admin.modal.cancel": { th: "ยกเลิก", en: "Cancel" },
  "admin.modal.confirm": { th: "ยืนยัน", en: "Confirm" },
  "admin.modal.status_title": { th: "ยืนยันการเปลี่ยนสถานะ?", en: "Confirm Status Transition?" },
  "admin.modal.status_desc": { th: "คุณต้องการเปลี่ยนสถานะคำสั่งซื้อเป็น '{status}' ใช่หรือไม่?", en: "Are you sure you want to transition the order status to '{status}'?" },
  "admin.modal.cancel_title": { th: "ยืนยันการยกเลิกคำสั่งซื้อ?", en: "Confirm Order Cancellation?" },
  "admin.modal.cancel_desc": { th: "คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้", en: "Are you sure you want to cancel this order? This action cannot be undone." },

  // Admin Products Tab
  "admin.products.add_title": { th: "เพิ่มสินค้าใหม่", en: "Add New Product" },
  "admin.products.upload": { th: "📁 อัพโหลด", en: "📁 Upload" },
  "admin.products.url": { th: "🔗 URL รูปภาพ", en: "🔗 Image URL" },
  "admin.products.upload_tap": { th: "แตะเพื่ออัพโหลดรูปภาพ", en: "Tap to upload product image" },
  "admin.products.label.name": { th: "ชื่อสินค้า *", en: "Product Name *" },
  "admin.products.label.price": { th: "ราคา (฿) *", en: "Price (฿) *" },
  "admin.products.label.stock": { th: "สต็อกสินค้า *", en: "Stock Quantity *" },
  "admin.products.label.description": { th: "คำอธิบายสินค้า", en: "Product Description" },
  "admin.products.add_button": { th: "เพิ่มสินค้าเข้าระบบ", en: "Add Product to Inventory" },
  "admin.products.empty": { th: "ยังไม่มีสินค้า — เพิ่มได้ที่ด้านบน", en: "No products in store — add one above" },
  "admin.products.edit.change_image": { th: "เปลี่ยนรูป", en: "Change" },
  "admin.products.edit.save": { th: "บันทึก", en: "Save" },
  "admin.products.edit.delete_confirm": { th: "คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?", en: "Are you sure you want to delete this product?" },
  "admin.products.edit.units": { th: "ชิ้น", en: "units" },

  // Admin Toast Notifications
  "admin.toast.slip_approved": { th: "อนุมัติสลิปโอนเงินแล้ว", en: "Slip approved successfully" },
  "admin.toast.slip_rejected": { th: "สลิปไม่ผ่าน — แจ้งลูกค้าส่งใหม่", en: "Slip rejected — please resubmit" },
  "admin.toast.product_added": { th: "เพิ่มสินค้าเข้าระบบสำเร็จ", en: "Product added successfully" },
  "admin.toast.product_updated": { th: "อัปเดตข้อมูลสินค้าแล้ว", en: "Product updated successfully" },
  "admin.toast.product_deleted": { th: "ลบสินค้าออกจากระบบแล้ว", en: "Product deleted successfully" },

  // Dashboard & Statistics
  "admin.tab.dashboard": { th: "หน้าหลัก", en: "Dashboard" },
  "admin.stats.revenue_desc": { th: "ยอดขายสะสม", en: "Accumulated sales" },
  "admin.stats.total_orders": { th: "คำสั่งซื้อทั้งหมด", en: "Total Orders" },
  "admin.stats.preparing": { th: "เตรียมจัดส่ง", en: "Preparing" },
  "admin.stats.shipped": { th: "จัดส่งแล้ว", en: "Shipped" },
  "admin.stats.view_all": { th: "ดูทั้งหมด {count} รายการ →", en: "View all {count} items →" },
  "admin.orders.shipping_type": { th: "ประเภทการจัดส่ง", en: "Shipping Type" },
  "admin.orders.shipping_all": { th: "ทั้งหมด", en: "All" },
  "admin.orders.shipping_delivery": { th: "จัดส่ง", en: "Delivery" },
  "admin.orders.shipping_pickup": { th: "รับเอง", en: "Pickup" },
  "admin.orders.status_label": { th: "สถานะ", en: "Status" },

  // Options & Delete Product Modal
  "admin.products.options": { th: "ตัวเลือก", en: "Options" },
  "admin.products.edit.delete_modal_title": { th: "ลบสินค้านี้ใช่ไหม?", en: "Delete this product?" },
  "admin.products.edit.delete_modal_desc": { th: "การลบไม่สามารถย้อนกลับได้", en: "This action cannot be undone." },
  "admin.products.edit.delete_modal_confirm": { th: "ลบเลย", en: "Delete" },
  "admin.products.edit.delete_modal_cancel": { th: "ยกเลิก", en: "Cancel" },
  "admin.products.label.name_th": { th: "ชื่อสินค้า (ภาษาไทย) *", en: "Product Name (Thai) *" },
  "admin.products.label.name_en": { th: "ชื่อสินค้า (ภาษาอังกฤษ)", en: "Product Name (English)" },
  "admin.products.label.description_th": { th: "คำอธิบายสินค้า (ภาษาไทย)", en: "Product Description (Thai)" },
  "admin.products.label.description_en": { th: "คำอธิบายสินค้า (ภาษาอังกฤษ)", en: "Product Description (English)" },
  "admin.products.label.price_label": { th: "ราคา (฿) *", en: "Price (฿) *" },
  "admin.products.label.stock_label": { th: "สต็อกสินค้า *", en: "Stock Quantity *" },
  "admin.products.edit.title": { th: "แก้ไขสินค้า", en: "Edit Product" },
  "admin.products.image.primary": { th: "หลัก", en: "Primary" },
  "admin.products.image.add": { th: "เพิ่ม", en: "Add" },
  "admin.products.image.required": { th: "ต้องมีรูปอย่างน้อย 1 รูป", en: "At least 1 image is required" },
  "admin.products.image.upload": { th: "อัปโหลดรูปสินค้า", en: "Upload product images" },
  "admin.products.image.hint": { th: "สูงสุด {max} รูป · รูปแรก = รูปหลัก", en: "Max {max} images · First image = Primary" },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("th");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app-lang");
      if (stored === "th" || stored === "en") {
        setLangState(stored);
      }
    } catch {}
    setMounted(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("app-lang", newLang);
    } catch {}
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    
    let text = entry[lang] || entry["th"]; // Fallback to TH if not present in translation
    
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {/* Provide an easy SSR fallback by just displaying children once mounting/hydration completes safely
          Wrap with key={lang} to force re-render children cleanly on change, avoiding stale React click event states */}
      <div key={lang}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
