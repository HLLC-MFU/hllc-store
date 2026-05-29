/* ============================================
   HLLC E-Commerce — i18n & Translations
   Dictionary and language translations utilities
   ============================================ */

/* ─── Dictionary & Translations Context ────────────────────────── */
const DICTIONARY = {
  "nav.home": { th: "หน้าหลัก", en: "Home" },
  "nav.cart": { th: "ตะกร้า", en: "Cart" },
  "nav.profile": { th: "โปรไฟล์", en: "Profile" },
  "nav.guest": { th: "ผู้ใช้ทั่วไป", en: "Guest User" },
  "nav.store": { th: "ร้านค้า", en: "Store" },
  "select.title": { th: "HLLC สโตร์", en: "HLLC Store" },
  "select.subtitle": { th: "กรุณาเลือกช่องทางที่คุณต้องการไป", en: "Choose where you want to go." },
  "select.home": { th: "เข้าสู่หน้าหลักร้านค้า", en: "Go to Shop Home" },
  "select.admin": { th: "เข้าสู่ระบบหลังบ้าน", en: "Go to Admin Dashboard" },
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
  "checkout.step.product": { th: "สินค้า", en: "Product" },
  "checkout.step.info": { th: "ข้อมูล", en: "Info" },
  "checkout.step.payment": { th: "ชำระเงิน", en: "Payment" },
  "checkout.qty": { th: "จำนวน", en: "Quantity" },
  "checkout.discount": { th: "ส่วนลด", en: "Discount" },
  "checkout.shipping": { th: "ค่าจัดส่ง", en: "Shipping Cost" },
  "checkout.shipping.free": { th: "ฟรี", en: "FREE" },
  "checkout.total": { th: "ยอดรวม", en: "Total" },
  "checkout.continue": { th: "ดำเนินการต่อ", en: "Continue" },
  "checkout.delivery_method": { th: "วิธีรับสินค้า", en: "Delivery Method" },
  "checkout.method.delivery": { th: "จัดส่ง", en: "Delivery" },
  "checkout.method.pickup": { th: "รับเอง", en: "Self Pickup" },
  "checkout.pickup.location": { th: "รับที่ D1", en: "Pick up at D1" },
  "checkout.pickup.sub": { th: "กรุณาแจ้งชื่อ เวลา และเบอร์ติดต่อ", en: "Please notify name, time, and contact info" },
  "checkout.label.firstname": { th: "*ชื่อ", en: "*First Name" },
  "checkout.label.lastname": { th: "*นามสกุล", en: "*Last Name" },
  "checkout.label.address": { th: "*ที่อยู่", en: "*Address" },
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
  "checkout.order_id": { th: "หมายเลขคำสั่งซื้อ", en: "Order Number" },
  "checkout.scan_qr": { th: "สแกน QR Code เพื่อชำระเงิน", en: "Scan QR Code for Payment" },
  "checkout.payment_amount": { th: "ยอดชำระ", en: "Payment Amount" },
  "checkout.upload_slip": { th: "อัพโหลดสลิปหลังโอนเงิน", en: "Upload slip after transfer" },
  "checkout.upload_tap": { th: "แตะเพื่ออัพโหลดสลิป", en: "Tap to upload payment slip" },
  "checkout.confirm_payment": { th: "ยืนยันการโอนเงิน", en: "Confirm Payment" },
  "checkout.sending": { th: "กำลังส่ง...", en: "Sending..." },
  "checkout.success.title": { th: "สั่งซื้อสำเร็จ!", en: "Order Successful!" },
  "checkout.success.slip_sent": { th: "ส่งสลิปเรียบร้อย ทีมงานจะตรวจสอบโดยเร็ว", en: "Slip submitted! Our team will verify it shortly." },
  "checkout.success.no_slip": { th: "กรุณาส่งสลิปการโอนเงินให้ทีมงาน", en: "Please submit your payment slip to the team." },
  "checkout.success.back": { th: "กลับไปเลือกสินค้า", en: "Back to Shop" },
  "admin.login.title": { th: "เข้าสู่ระบบผู้ดูแลระบบ", en: "Admin Login Portal" },
  "admin.login.subtitle": { th: "กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อเข้าจัดการสโตร์ HLLC", en: "Please sign in with your administrator account to manage HLLC Store" },
  "admin.login.username": { th: "ชื่อผู้ใช้", en: "Username" },
  "admin.login.password": { th: "รหัสผ่าน", en: "Password" },
  "admin.login.button": { th: "เข้าสู่ระบบหลังบ้าน", en: "Sign In as Admin" },
  "admin.login.error": { th: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", en: "Invalid username or password" },
  "admin.login.desc": { th: "ข้อมูลรับรองเริ่มต้น: admin / password", en: "Default credentials: admin / password" },
  "admin.header": { th: "HLLC หลังบ้าน", en: "HLLC Admin Portal" },
  "admin.pending_badge": { th: "รอตรวจ {count} รายการ", en: "Pending {count} reviews" },
  "admin.stats_summary": { th: "{orders} คำสั่งซื้อ · {products} สินค้า", en: "{orders} orders · {products} products" },
  "admin.tab.orders": { th: "คำสั่งซื้อ", en: "Orders" },
  "admin.tab.products": { th: "สินค้า", en: "Products" },
  "admin.stats.revenue": { th: "ยอดขายรวม", en: "Total Revenue" },
  "admin.stats.pending": { th: "สลิปที่รอตรวจ", en: "Pending Slips" },
  "admin.stats.active": { th: "จัดส่งแล้ว/รอรับของ", en: "Active Shipments" },
  "admin.stats.completed": { th: "เสร็จสิ้น", en: "Completed Orders" },
  "admin.orders.pending_review": { th: "รอตรวจสลิป ({count})", en: "Pending Slip Review ({count})" },
  "admin.orders.all": { th: "คำสั่งซื้อทั้งหมด", en: "All Orders" },
  "admin.orders.search_placeholder": { th: "ค้นหาด้วยชื่อ, เบอร์โทร...", en: "Search by customer name, phone..." },
  "admin.orders.filter_all": { th: "ทั้งหมด", en: "All" },
  "admin.orders.filter_delivery": { th: "🚚 จัดส่ง", en: "Shipping" },
  "admin.orders.filter_pickup": { th: "🏪 รับเอง", en: "Pickup" },
  "admin.orders.empty": { th: "ไม่มีคำสั่งซื้อ", en: "No orders found" },
  "admin.slip.view": { th: "ดูรูปสลิป", en: "View Slip" },
  "admin.slip.approve": { th: "อนุมัติ", en: "Approve" },
  "admin.slip.reject": { th: "ปฏิเสธ", en: "Reject" },
  "admin.status.payment_review": { th: "รอตรวจสลิป", en: "Payment Review" },
  "admin.status.shipped": { th: "จัดส่งแล้ว / รอรับของ", en: "Shipped / Ready for Pickup" },
  "admin.status.completed": { th: "เสร็จสิ้น", en: "Completed" },
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
  "admin.modal.approve_title": { th: "ยืนยันการอนุมัติ?", en: "Confirm Approval?" },
  "admin.modal.reject_title": { th: "ยืนยันการปฏิเสธ?", en: "Confirm Rejection?" },
  "admin.modal.approve_desc": { th: "สลิปจะถูกอนุมัติ และสถานะออเดอร์จะเปลี่ยนเป็น 'จัดส่งแล้ว / รอรับของ'", en: "Slip will be approved and order status will change to 'Shipped / Ready for Pickup'" },
  "admin.modal.reject_desc": { th: "สลิปจะถูกปฏิเสธ และระบบจะรอสลิปใหม่จากลูกค้า", en: "Slip will be rejected and system will wait for a new slip from customer" },
  "admin.modal.cancel": { th: "ยกเลิก", en: "Cancel" },
  "admin.modal.confirm": { th: "ยืนยัน", en: "Confirm" },
  "admin.modal.status_title": { th: "ยืนยันการเปลี่ยนสถานะ?", en: "Confirm Status Transition?" },
  "admin.modal.status_desc": { th: "คุณต้องการเปลี่ยนสถานะคำสั่งซื้อเป็น '{status}' ใช่หรือไม่?", en: "Are you sure you want to transition the order status to '{status}'?" },
  "admin.modal.cancel_title": { th: "ยืนยันการยกเลิกคำสั่งซื้อ?", en: "Confirm Order Cancellation?" },
  "admin.modal.cancel_desc": { th: "คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้", en: "Are you sure you want to cancel this order? This action cannot be undone." },
  "admin.products.add_title": { th: "เพิ่มสินค้าใหม่", en: "Add New Product" },
  "admin.products.upload": { th: "📁 อัพโหลด", en: "📁 Upload" },
  "admin.products.url": { th: "🔗 URL รูปภาพ", en: "🔗 Image URL" },
  "admin.products.upload_tap": { th: "แตะเพื่ออัพโหลดรูปภาพ", en: "Tap to upload product image" },
  "admin.products.label.name": { th: "ชื่อสินค้า *", en: "Product Name *" },
  "admin.products.label.price": { th: "ราคา (฿) *", en: "Price (฿) *" },
  "admin.products.label.stock": { th: "สต็อกสินค้า *", en: "Stock Quantity *" },
  "admin.products.label.discount": { th: "ส่วนลด (%)", en: "Discount (%)" },
  "admin.products.label.description": { th: "คำอธิบายสินค้า", en: "Product Description" },
  "admin.products.add_button": { th: "เพิ่มสินค้าเข้าระบบ", en: "Add Product to Inventory" },
  "admin.products.empty": { th: "ยังไม่มีสินค้า — เพิ่มได้ที่ด้านบน", en: "No products in store — add one above" },
  "admin.products.edit.change_image": { th: "เปลี่ยนรูป", en: "Change" },
  "admin.products.edit.discounted": { th: "ราคาหลังลด:", en: "Discounted Price:" },
  "admin.products.edit.save": { th: "บันทึก", en: "Save" },
  "admin.products.edit.delete_confirm": { th: "คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?", en: "Are you sure you want to delete this product?" },
  "admin.products.edit.units": { th: "ชิ้น", en: "units" },
  "admin.toast.slip_approved": { th: "✓ อนุมัติสลิปโอนเงินแล้ว", en: "✓ Slip approved successfully" },
  "admin.toast.slip_rejected": { th: "✗ ปฏิเสธสลิปโอนเงินแล้ว", en: "✗ Slip rejected successfully" },
  "admin.toast.product_added": { th: "เพิ่มสินค้าเข้าระบบสำเร็จ", en: "Product added successfully" },
  "admin.toast.product_updated": { th: "อัปเดตข้อมูลสินค้าแล้ว", en: "Product updated successfully" },
  "admin.toast.product_deleted": { th: "ลบสินค้าออกจากระบบแล้ว", en: "Product deleted successfully" },
  
  // Dynamic Mock Product Titles
  "product.mock-1.name": { th: "เสื้อกันฝน Classic", en: "Classic Raincoat" },
  "product.mock-1.desc": { th: "กันน้ำ 100% เนื้อผ้าเบา มีฮูด ใส่ง่าย", en: "100% waterproof, lightweight fabric, has a hood, easy to wear" },
  "product.mock-2.name": { th: "ร่มพับ Ultra Light", en: "Ultra Light Folding Umbrella" },
  "product.mock-2.desc": { th: "พับ 3 ตอน น้ำหนักเพียง 280g กระทัดรัด", en: "3-section folding umbrella, weight only 280g, compact size" },
  "product.mock-3.name": { th: "ชุดกันฝน Pro Set", en: "Pro Rain Suit Set" },
  "product.mock-3.desc": { th: "เสื้อ + กางเกง กันน้ำ กันลม ครบชุด", en: "Jacket + Pants, waterproof, windproof, full set" },
  "product.mock-4.name": { th: "ร่มกอล์ฟ XL", en: "Golf Umbrella XL" },
  "product.mock-4.desc": { th: "เส้นผ่านศูนย์กลาง 130cm คุ้มแดดคุ้มฝน", en: "130cm diameter, excellent sun and rain protection" },
  "product.mock-5.name": { th: "เสื้อกันฝน Reflective", en: "Reflective Raincoat" },
  "product.mock-5.desc": { th: "ติดแถบสะท้อนแสง ปลอดภัยขับมอเตอร์ไซค์", en: "High-visibility reflective strip, safe for motorcycling" },
  "product.mock-6.name": { th: "ปอนโช กันฝน", en: "Rain Poncho" },
  "product.mock-6.desc": { th: "สวมทับได้ทันที เหมาะสำหรับปั่นจักรยาน", en: "Instant slip-on, suitable for cycling" },
  "product.mock-7.name": { th: "รองเท้ากันน้ำ", en: "Waterproof Shoes" },
  "product.mock-7.desc": { th: "วัสดุ EVA อย่างดี กันน้ำ 100% ทนทาน", en: "Premium EVA material, 100% waterproof, durable" },
  "product.mock-8.name": { th: "หมวกกันฝน ปีกรอบ", en: "Wide Brim Rain Hat" },
  "product.mock-8.desc": { th: "วัสดุกันน้ำ ปีกกว้างคุ้มแดดคุ้มฝน", en: "Waterproof material, wide brim for sun and rain protection" },
  "admin.action.copy": { th: "คัดลอกที่อยู่", en: "Copy Address" },
  "admin.action.print_label": { th: "พิมพ์ใบแปะหน้าพัสดุ", en: "Print Courier Label" },
  "admin.toast.address_copied": { th: "คัดลอกที่อยู่ไปยังคลิปบอร์ดแล้ว!", en: "Address copied to clipboard!" },
  "admin.gauge.title": { th: "สรุปสถานะสัดส่วนพัสดุรวม", en: "Operational Status Distribution" },
  "admin.stat.total_products": { th: "สินค้าทั้งหมด", en: "Total Products" },
  "admin.stat.out_of_stock": { th: "สินค้าที่หมดเกลี้ยง", en: "Out of Stock" },
  "admin.stat.discounted_products": { th: "สินค้าลดราคา", en: "On Sale" },
  "admin.search.product_placeholder": { th: "ค้นหาสินค้าหลังบ้าน...", en: "Search inventory items..." },
  "admin.action.workflow_title": { th: "ตัวช่วยจัดการขั้นตอนการจัดส่ง (Unified Workflow)", en: "Operations Logistics Workflow Management" },
  "admin.action.workflow_next": { th: "ดำเนินการขั้นถัดไป", en: "Perform Next Action" },
  "admin.workflow.approve": { th: "✓ อนุมัติการชำระเงิน", en: "✓ Approve Payment" },
  "admin.workflow.complete": { th: "✅ เสร็จสิ้นออเดอร์", en: "✅ Complete Order" },
  "admin.workflow.cancel": { th: "❌ ยกเลิกและยกยอดคำสั่งซื้อนี้", en: "❌ Cancel and Void Order" },
  "admin.workflow.rollback": { th: "↩️ ย้อนกลับขั้นตอน", en: "↩️ Rollback Stage" },
  "admin.label.sender": { th: "ผู้ส่ง (Sender)", en: "Sender" },
  "admin.label.recipient": { th: "ผู้รับ (Recipient)", en: "Recipient" },
  "admin.label.print_title": { th: "ใบปะหน้ากล่องพัสดุอย่างเป็นทางการ HLLC", en: "Official HLLC Shipping Label" }
};


/* ─── Translating Context Utility ───────────────────────── */
function t(key, replacements = null) {
  const entry = DICTIONARY[key];
  if (!entry) return key;
  let val = entry[State.lang] || entry["th"];
  if (replacements) {
    Object.keys(replacements).forEach(k => {
      val = val.replace(`{${k}}`, replacements[k]);
    });
  }
  return val;
}

function translateAllElements() {
  // Data translations attributes
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.getAttribute("data-t");
    el.innerText = t(key);
  });
  // Placeholder translation support
  document.querySelectorAll("[data-t-placeholder]").forEach(el => {
    const key = el.getAttribute("data-t-placeholder");
    el.setAttribute("placeholder", t(key));
  });
  
  // Floating Switch buttons classes
  document.getElementById("lang-btn-th").className = State.lang === "th" ? "active" : "";
  document.getElementById("lang-btn-en").className = State.lang === "en" ? "active" : "";
  
  // Refresh count values and products names dynamically
  renderCategoryLists();
  renderShopProductsGrid();
  updateCheckoutModalUI();
  renderAdminDashboard();
}

function setLanguage(l) {
  State.lang = l;
  State.save();
  translateAllElements();
}

