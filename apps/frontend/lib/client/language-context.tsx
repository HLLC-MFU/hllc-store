"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "th" | "en";

interface TranslationDict {
  [key: string]: {
    th: string;
    en: string;
  };
}

const DICTIONARY: TranslationDict = {
  // Navigation
  "nav.back": { th: "ย้อนกลับ", en: "Back" },
  "nav.home": { th: "หน้าหลัก", en: "Home" },
  "nav.cart": { th: "ตะกร้า", en: "Cart" },
  "nav.track_order": { th: "ติดตามพัสดุ", en: "Track Order" },
  "nav.profile": { th: "โปรไฟล์", en: "Profile" },
  "nav.guest": { th: "ผู้ใช้ทั่วไป", en: "Guest" },
  "nav.store": { th: "ร้านค้า", en: "Shop" },

  // Select Index Page
  "select.title": { th: "HLLC สโตร์", en: "HLLC Store" },
  "select.subtitle": { th: "ไปหน้าไหนดี?", en: "Where do you want to go?" },
  "select.home": { th: "ไปที่ร้านค้า", en: "Go to Shop" },
  "select.admin": { th: "เข้าหลังบ้าน", en: "Admin Panel" },

  // Shop Home Page
  "shop.search_placeholder": { th: "ค้นหาสินค้า...", en: "Search..." },
  "shop.all_products": { th: "สินค้าทั้งหมด", en: "All" },
  "shop.items_count": { th: "ชิ้น", en: "items" },
  "shop.no_results": { th: "ไม่เจอสินค้าที่ค้นหา", en: "No results found" },
  "shop.no_category": { th: "ยังไม่มีสินค้าในหมวดนี้", en: "No items in this category" },
  "shop.out_of_stock": { th: "หมดแล้ว", en: "Out of Stock" },
  "shop.order_now": { th: "สั่งเลย", en: "Order Now" },
  "shop.categories": { th: "หมวดหมู่", en: "Category" },
  "shop.cat.umbrella": { th: "ร่ม", en: "Umbrella" },
  "shop.cat.raincoat": { th: "เสื้อกันฝน", en: "Raincoat" },
  "shop.cat.rainsuit": { th: "ชุดกันฝน", en: "Rain Suit" },
  "shop.cat.shoes": { th: "รองเท้า", en: "Shoes" },
  "shop.cat.others": { th: "อื่นๆ", en: "Others" },

  // Order Sheet Steps
  "checkout.step.product": { th: "สินค้า", en: "Items" },
  "checkout.step.info": { th: "ข้อมูล", en: "Details" },
  "checkout.step.payment": { th: "ชำระเงิน", en: "Payment" },

  // Order Sheet Step 1
  "checkout.qty": { th: "จำนวน", en: "Qty" },
  "checkout.shipping": { th: "ค่าส่ง", en: "Shipping" },
  "checkout.shipping.free": { th: "ฟรี", en: "Free" },
  "checkout.total": { th: "รวม", en: "Total" },
  "checkout.continue": { th: "ถัดไป", en: "Next" },

  // Order Sheet Step 2
  "checkout.delivery_method": { th: "วิธีรับสินค้า", en: "How to receive" },
  "checkout.method.delivery": { th: "จัดส่ง", en: "Delivery" },
  "checkout.method.pickup": { th: "รับเอง", en: "Pickup" },
  "checkout.pickup.location": { th: "รับที่ D1", en: "Pickup at D1" },
  "checkout.pickup.sub": { th: "ระบุชื่อ เวลา และเบอร์ที่ติดต่อได้", en: "Enter your name, time, and contact number" },
  "checkout.label.firstname": { th: "ชื่อ", en: "First Name" },
  "checkout.label.lastname": { th: "นามสกุล", en: "Last Name" },
  "checkout.label.address": { th: "บ้านเลขที่, อาคาร, ถนน, แขวง/ตำบล", en: "Address, Street, Sub-district" },
  "checkout.label.district": { th: "เขต/อำเภอ", en: "District" },
  "checkout.label.province": { th: "จังหวัด", en: "Province" },
  "checkout.label.postal": { th: "รหัสไปรษณีย์", en: "Postal Code" },
  "checkout.label.phone": { th: "เบอร์โทร", en: "Phone" },
  "checkout.label.email": { th: "อีเมล", en: "Email" },
  "checkout.free_shipping_banner": { th: "ส่งฟรี ถึงมือใน 1–3 วัน", en: "Free shipping, 1–3 days" },
  "checkout.pickup.name": { th: "ชื่อผู้รับ", en: "Recipient Name" },
  "checkout.pickup.time": { th: "เวลาที่จะมารับ", en: "Pickup Time" },
  "checkout.error.fill_fields": { th: "กรอกข้อมูลให้ครบก่อนนะ", en: "Please fill in all fields" },
  "checkout.confirm_button": { th: "สั่งซื้อเลย", en: "Place Order" },
  "checkout.creating_order": { th: "กำลังสร้างออเดอร์...", en: "Placing order..." },
  "checkout.select_province": { th: "เลือกจังหวัด", en: "Select province" },
  "checkout.search_province": { th: "ค้นหาจังหวัด...", en: "Search..." },
  "checkout.no_province": { th: "ไม่พบจังหวัด", en: "Not found" },

  // Order Sheet Step 3
  "checkout.order_id": { th: "เลขออเดอร์", en: "Order ID" },
  "checkout.scan_qr": { th: "สแกน QR เพื่อโอนเงิน", en: "Scan QR to pay" },
  "checkout.payment_amount": { th: "ยอดที่ต้องโอน", en: "Amount to pay" },
  "checkout.upload_slip": { th: "อัปโหลดสลิปหลังโอน", en: "Upload slip after transfer" },
  "checkout.upload_tap": { th: "แตะเพื่ออัปโหลดสลิป", en: "Tap to upload slip" },
  "checkout.confirm_payment": { th: "ยืนยันการโอน", en: "Confirm Transfer" },
  "checkout.sending": { th: "กำลังส่ง...", en: "Sending..." },

  // Order Sheet Success
  "checkout.success.title": { th: "สั่งสำเร็จแล้ว!", en: "Order placed!" },
  "checkout.success.slip_sent": { th: "ได้รับสลิปแล้ว ทีมงานจะตรวจสอบเร็วๆ นี้", en: "Got your slip! We'll check it shortly." },
  "checkout.success.no_slip": { th: "อย่าลืมส่งสลิปให้ทีมงานด้วยนะ", en: "Don't forget to send us your slip." },
  "checkout.success.back": { th: "ช้อปต่อ", en: "Keep Shopping" },

  // Admin Login
  "admin.login.title": { th: "เข้าสู่ระบบ Admin", en: "Admin Login" },
  "admin.login.subtitle": { th: "สำหรับทีมงาน HLLC เท่านั้น", en: "For HLLC staff only" },
  "admin.login.username": { th: "ชื่อผู้ใช้", en: "Username" },
  "admin.login.password": { th: "รหัสผ่าน", en: "Password" },
  "admin.login.button": { th: "เข้าสู่ระบบ", en: "Sign In" },
  "admin.login.error": { th: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", en: "Wrong username or password" },
  "admin.login.desc": { th: "HLLC Store · Admin Portal", en: "HLLC Store · Admin Portal" },

  // Admin Header
  "admin.header": { th: "HLLC Admin", en: "HLLC Admin" },
  "admin.pending_badge": { th: "รอตรวจ {count} รายการ", en: "{count} pending" },
  "admin.stats_summary": { th: "{orders} ออเดอร์ · {products} สินค้า", en: "{orders} orders · {products} products" },
  "admin.tab.orders": { th: "ออเดอร์", en: "Orders" },
  "admin.tab.products": { th: "สินค้า", en: "Products" },
  "admin.tab.storefront": { th: "หน้าร้าน", en: "Storefront" },

  // Admin Stats Grid
  "admin.stats.revenue": { th: "ยอดขายรวม", en: "Revenue" },
  "admin.stats.pending": { th: "รอตรวจสลิป", en: "Pending Slips" },
  "admin.stats.active": { th: "กำลังดำเนินการ", en: "In Progress" },
  "admin.stats.completed": { th: "ส่งสำเร็จ", en: "Delivered" },

  // Admin Orders Tab
  "admin.orders.pending_review": { th: "รอตรวจสลิป ({count})", en: "Pending ({count})" },
  "admin.orders.all": { th: "ออเดอร์ทั้งหมด", en: "All Orders" },
  "admin.orders.search_placeholder": { th: "ค้นหาชื่อ, เบอร์, อีเมล หรือเลขพัสดุ...", en: "Search name, phone, email or tracking no..." },
  "admin.orders.filter_all": { th: "ทั้งหมด", en: "All" },
  "admin.orders.filter_delivery": { th: "จัดส่ง", en: "Delivery" },
  "admin.orders.filter_pickup": { th: "รับเอง", en: "Pickup" },
  "admin.orders.empty": { th: "ยังไม่มีออเดอร์", en: "No orders yet" },

  // Admin Slip Review Card
  "admin.slip.view": { th: "ดูสลิป", en: "View Slip" },
  "admin.slip.approve": { th: "อนุมัติ", en: "Approve" },
  "admin.slip.reject": { th: "ขอสลิปใหม่", en: "Request New Slip" },

  // Admin Order Row & Stepper
  "admin.status.pending_payment": { th: "รอชำระเงินใหม่", en: "Awaiting New Payment" },
  "admin.status.payment_review": { th: "รอตรวจสลิป", en: "Checking Slip" },
  "admin.status.paid": { th: "ชำระแล้ว", en: "Paid" },
  "admin.status.packing": { th: "กำลังแพ็ค", en: "Packing" },
  "admin.status.shipped": { th: "จัดส่งแล้ว", en: "Shipped" },
  "admin.status.shipped_pickup": { th: "พร้อมรับสินค้า", en: "Ready for Pickup" },
  "admin.status.completed": { th: "รับสินค้าแล้ว", en: "Picked Up" },
  "admin.status.completed_pickup": { th: "รับสินค้าแล้ว", en: "Picked Up" },
  "admin.status.cancelled": { th: "ยกเลิกแล้ว", en: "Cancelled" },

  "admin.order.shipping_label": { th: "ใบติดพัสดุ", en: "Shipping Label" },
  "admin.order.pickup_label": { th: "ข้อมูลรับเอง", en: "Pickup Info" },
  "admin.order.address": { th: "ที่อยู่จัดส่ง", en: "Shipping Address" },
  "admin.order.pickup_details": { th: "รายละเอียดรับเอง", en: "Pickup Details" },
  "admin.order.phone": { th: "เบอร์โทร", en: "Phone" },
  "admin.order.slip_status": { th: "สถานะสลิป", en: "Slip Status" },
  "admin.order.change_status": { th: "เปลี่ยนสถานะ", en: "Change Status" },
  "admin.order.next_stage": { th: "ขั้นถัดไป", en: "Next Step" },
  "admin.order.prev_stage": { th: "ย้อนกลับ", en: "Go Back" },
  "admin.order.is_completed": { th: "ลูกค้ารับสินค้าแล้ว! ✓", en: "Customer picked up! ✓" },
  "admin.order.item": { th: "รายการสินค้า", en: "Items" },

  // Admin Modals
  "admin.modal.approve_title": { th: "อนุมัติสลิปนี้?", en: "Approve this slip?" },
  "admin.modal.reject_title": { th: "ขอสลิปใหม่?", en: "Request a new slip?" },
  "admin.modal.approve_desc": { th: "ออเดอร์จะเปลี่ยนเป็น 'ชำระแล้ว' และเริ่มแพ็คได้เลย", en: "Order will move to 'Paid' and ready to pack" },
  "admin.modal.reject_desc": { th: "ออเดอร์จะกลับไปรอสลิปใหม่ และลูกค้าจะได้รับแจ้งให้อัปโหลดอีกครั้ง", en: "Order will wait for a new slip and the customer will be asked to upload again" },
  "admin.modal.cancel": { th: "ยกเลิก", en: "Cancel" },
  "admin.modal.confirm": { th: "ยืนยัน", en: "Confirm" },
  "admin.modal.status_title": { th: "เปลี่ยนสถานะ?", en: "Change status?" },
  "admin.modal.status_desc": { th: "เปลี่ยนสถานะออเดอร์เป็น '{status}'?", en: "Change order status to '{status}'?" },
  "admin.modal.cancel_title": { th: "ยกเลิกออเดอร์นี้?", en: "Cancel this order?" },
  "admin.modal.cancel_desc": { th: "ยกเลิกแล้วไม่สามารถกู้คืนได้นะ", en: "This can't be undone." },

  // Admin Products Tab
  "admin.products.add_title": { th: "เพิ่มสินค้า", en: "Add Product" },
  "admin.products.upload": { th: "📁 อัปโหลด", en: "📁 Upload" },
  "admin.products.url": { th: "🔗 URL รูป", en: "🔗 Image URL" },
  "admin.products.upload_tap": { th: "แตะเพื่อเพิ่มรูป", en: "Tap to add image" },
  "admin.products.label.name": { th: "ชื่อสินค้า", en: "Product Name" },
  "admin.products.label.price": { th: "ราคา (฿)", en: "Price (฿)" },
  "admin.products.label.stock": { th: "จำนวนสต็อก", en: "Stock" },
  "admin.products.label.description": { th: "รายละเอียด", en: "Description" },
  "admin.products.add_button": { th: "เพิ่มสินค้า", en: "Add Product" },
  "admin.products.empty": { th: "ยังไม่มีสินค้า กดปุ่ม + เพื่อเพิ่ม", en: "No products yet — tap + to add" },
  "admin.products.edit.change_image": { th: "เปลี่ยนรูป", en: "Change" },
  "admin.products.edit.save": { th: "บันทึก", en: "Save" },
  "admin.products.edit.delete_confirm": { th: "ลบสินค้านี้?", en: "Delete this product?" },
  "admin.products.edit.units": { th: "ชิ้น", en: "pcs" },

  // Admin Toast Notifications
  "admin.toast.slip_approved": { th: "อนุมัติสลิปแล้ว ✓", en: "Slip approved ✓" },
  "admin.toast.slip_rejected": { th: "ส่งกลับไปรอสลิปใหม่แล้ว", en: "Waiting for a new slip" },
  "admin.toast.product_added": { th: "เพิ่มสินค้าแล้ว ✓", en: "Product added ✓" },
  "admin.toast.product_updated": { th: "อัปเดตสินค้าแล้ว ✓", en: "Product updated ✓" },
  "admin.toast.product_deleted": { th: "ลบสินค้าแล้ว", en: "Product deleted" },

  // Dashboard & Statistics
  "admin.tab.dashboard": { th: "ภาพรวม", en: "Overview" },
  "admin.stats.revenue_desc": { th: "ยอดขายสะสม", en: "Total sales" },
  "admin.stats.total_orders": { th: "ออเดอร์ทั้งหมด", en: "Total Orders" },
  "admin.stats.preparing": { th: "กำลังแพ็ค", en: "Packing" },
  "admin.stats.shipped": { th: "จัดส่งแล้ว", en: "Shipped" },
  "admin.stats.view_all": { th: "ดูทั้งหมด {count} รายการ →", en: "View all {count} →" },
  "admin.orders.shipping_type": { th: "ประเภทการรับ", en: "Fulfillment" },
  "admin.orders.shipping_all": { th: "ทั้งหมด", en: "All" },
  "admin.orders.shipping_delivery": { th: "จัดส่ง", en: "Delivery" },
  "admin.orders.shipping_pickup": { th: "รับเอง", en: "Pickup" },
  "admin.orders.status_label": { th: "สถานะ", en: "Status" },

  // Options & Delete Product Modal
  "admin.products.options": { th: "ตัวเลือก", en: "Options" },
  "admin.products.edit.delete_modal_title": { th: "ลบสินค้านี้?", en: "Delete this product?" },
  "admin.products.edit.delete_modal_desc": { th: "ลบแล้วกู้คืนไม่ได้นะ", en: "This can't be undone." },
  "admin.products.edit.delete_modal_confirm": { th: "ลบเลย", en: "Delete" },
  "admin.products.edit.delete_modal_cancel": { th: "ยกเลิก", en: "Cancel" },
  "admin.products.label.name_th": { th: "ชื่อภาษาไทย", en: "Thai Name" },
  "admin.products.label.name_en": { th: "ชื่อภาษาอังกฤษ", en: "English Name" },
  "admin.products.label.description_th": { th: "รายละเอียด (ไทย)", en: "Description (Thai)" },
  "admin.products.label.description_en": { th: "รายละเอียด (อังกฤษ)", en: "Description (English)" },
  "admin.products.label.price_label": { th: "ราคา (฿)", en: "Price (฿)" },
  "admin.products.label.stock_label": { th: "สต็อก", en: "Stock" },
  "admin.products.edit.title": { th: "แก้ไขสินค้า", en: "Edit Product" },
  "admin.products.image.primary": { th: "หลัก", en: "Main" },
  "admin.products.image.add": { th: "เพิ่ม", en: "Add" },
  "admin.products.image.required": { th: "ใส่รูปอย่างน้อย 1 รูปนะ", en: "At least 1 image required" },
  "admin.products.image.upload": { th: "อัปโหลดรูปสินค้า", en: "Upload images" },
  "admin.products.image.hint": { th: "ได้สูงสุด {max} รูป · รูปแรกเป็นรูปหลัก", en: "Up to {max} images · First = main photo" },
  "admin.products.placeholder.name": { th: "ชื่อสินค้าภาษาไทย", en: "Product name in Thai" },
  "admin.products.placeholder.name_en": { th: "ชื่อสินค้าภาษาอังกฤษ", en: "Product name in English" },
  "admin.products.placeholder.price": { th: "ราคา เช่น 39", en: "e.g. 39" },
  "admin.products.placeholder.stock": { th: "จำนวน เช่น 100", en: "e.g. 100" },
  "admin.products.placeholder.description": { th: "รายละเอียดสินค้า...", en: "Product description..." },
  "admin.products.placeholder.description_en": { th: "Product description...", en: "Product description..." },

  // Product Detail View
  "product.details": { th: "รายละเอียดสินค้า", en: "Product Details" },
  "product.quantity": { th: "จำนวน", en: "Quantity" },
  "product.out_of_stock": { th: "สินค้าหมด", en: "Out of Stock" },
  "product.buy_now": { th: "ซื้อเลย", en: "Buy Now" },
  "product.total_price": { th: "ราคารวม", en: "Total" },
  "product.select_option_first": { th: "กรุณาเลือกตัวเลือกสินค้าก่อน", en: "Please choose an option first" },
  "product.out_of_stock_toast": { th: "สินค้าหมดแล้ว", en: "Out of stock" },
  "product.added_to_cart": { th: "เพิ่มลงตะกร้าแล้ว {count} ชิ้น", en: "Added {count} to cart" },
  "product.stock_limit": { th: "เพิ่มไม่ได้แล้ว มีในสต็อกสูงสุด {stock} ชิ้น", en: "Can't add more — only {stock} in stock" },

  // Charm modal (product detail)
  "charm.keychain": { th: "พวงกุญแจ", en: "Keychain" },
  "charm.add_keychain": { th: "เพิ่มพวงกุญแจ", en: "Add keychain" },
  "charm.pick_color_letters": { th: "เลือกสี + ตัวอักษร", en: "Pick color + letters" },
  "charm.tap_add_letters": { th: "แตะเพื่อเพิ่มตัวอักษร", en: "Tap to add letters" },
  "charm.color_step": { th: "สี", en: "Color" },
  "charm.letters_step": { th: "ตัวอักษร", en: "Letters" },
  "charm.choose_color_heading": { th: "เลือกสีพวงกุญแจ — +{price}฿", en: "Choose keychain color — +{price}฿" },
  "charm.next_add_letters": { th: "ถัดไป — เพิ่มตัวอักษร", en: "Next — Add letters" },
  "charm.free_letters": { th: "{count} ตัวแรกฟรี", en: "Free {count} letters" },
  "charm.extra_letter_price": { th: "ตัวต่อไป +{price}฿", en: "+{price}฿ each after" },
  "charm.tap_letters_below": { th: "แตะตัวอักษรด้านล่างเพื่อเพิ่ม", en: "Tap letters below to add" },
  "charm.charm_label": { th: "พวงกุญแจ", en: "Keychain" },
  "charm.change_color": { th: "เปลี่ยนสี", en: "Change color" },
  "charm.confirm": { th: "ยืนยัน", en: "Confirm" },
  "charm.add_prompt_sub": { th: "เพิ่มพวงกุญแจชื่อพร้อมกับสินค้านี้ได้เลย", en: "You can add a keychain with this item" },
  "charm.add_with_price": { th: "เพิ่มพวงกุญแจ +30฿", en: "Add keychain +30฿" },
  "charm.no_thanks": { th: "ไม่เพิ่ม", en: "No thanks" },

  // Swipeable cart item
  "cart.add_keychain": { th: "เพิ่มสาย", en: "Add" },
  "cart.delete": { th: "ลบ", en: "Delete" },
  "cart.remove_aria": { th: "ลบสินค้าออกจากตะกร้า", en: "Remove item from cart" },
  "cart.custom_name_label": { th: "ชื่อ", en: "Name" },
  "cart.edit": { th: "แก้ไข", en: "Edit" },
  "cart.done": { th: "สำเร็จ", en: "Done" },
  "cart.pcs": { th: "ชิ้น", en: "pcs" },
  "cart.remove_charm_title": { th: "ลบพวงกุญแจออก?", en: "Remove keychain?" },
  "cart.remove_charm_sub": { th: "ราคาพวงกุญแจจะถูกนำออกจากยอดรวม", en: "Keychain price will be removed from total" },
  "cart.cancel": { th: "ยกเลิก", en: "Cancel" },
  "cart.remove": { th: "ลบออก", en: "Remove" },
  "cart.no_keychain": { th: "ยังไม่มีพวงกุญแจ", en: "No keychain yet" },
  "cart.keychain_plus": { th: "+ พวงกุญแจ", en: "+ Keychain" },
  "cart.keychain_label": { th: "พวงกุญแจ", en: "Keychain" },
  "cart.pick_keychain_color": { th: "เลือกสีพวงกุญแจ", en: "Pick keychain color" },
  "cart.pick_letters": { th: "เลือกตัวอักษร", en: "Pick letters" },
  "cart.free_letters": { th: "ตัวแรกฟรี", en: "free letters" },
  "cart.keychain_color_label": { th: "พวงกุญแจ", en: "Keychain" },

  // Category grid
  "shop.shop_now": { th: "ช้อปเลย", en: "Shop now" },
  "shop.choose": { th: "เลือกซื้อ", en: "Choose" },

  // Charm grid
  "charm.filter_all": { th: "ทั้งหมด", en: "All" },
  "charm.out_of_stock": { th: "หมดแล้ว", en: "Out of stock" },

  // Checkout Footer shipping rates
  "checkout.shipping_rates": { th: "อัตราค่าจัดส่ง", en: "Shipping rates" },
  "shipping.standard": { th: "ทั่วไป", en: "Standard" },
  "shipping.remote": { th: "ห่างไกล", en: "Remote Area" },
  "shipping.island": { th: "พิเศษ", en: "Island" },
  "shipping.first_item": { th: "ชิ้นแรก", en: "1st item" },
  "shipping.each_after": { th: "ชิ้นต่อไป", en: "each after" },

  // InfoStep
  "checkout.recipient": { th: "ข้อมูลผู้รับ", en: "Recipient" },
  "checkout.fulfillment": { th: "วิธีรับสินค้า", en: "Fulfillment" },
  "checkout.delivery": { th: "จัดส่ง", en: "Delivery" },
  "checkout.pickup": { th: "รับเอง", en: "Pickup" },
  "checkout.placeholder.fullname": { th: "ชื่อ-นามสกุล", en: "Full name" },
  "checkout.placeholder.phone": { th: "เบอร์โทรศัพท์", en: "Phone number" },
  "checkout.placeholder.email": { th: "อีเมล", en: "Email" },
  "checkout.email_note": { th: "ใช้อีเมลนี้เพื่อรับการแจ้งเตือนสถานะคำสั่งซื้อ", en: "We use this email for order status notifications." },
  "checkout.shipping_address": { th: "ที่อยู่จัดส่ง", en: "Shipping address" },
  "checkout.placeholder.address": { th: "บ้านเลขที่, อาคาร, หมู่, ถนน", en: "House no., building, street" },
  "checkout.pickup_at_d1": { th: "รับสินค้าเองที่ D1", en: "Pickup at D1" },
  "checkout.pickup_time_note": { th: "กรุณาระบุเวลาที่สะดวกมารับสินค้า", en: "Please select your preferred pickup time." },
  "checkout.proceed_to_pay": { th: "ชำระเงิน", en: " Pay" },
  "checkout.back": { th: "กลับ", en: "Back" },

  // Admin order-row inline strings
  "admin.order.save_tracking": { th: "บันทึกหมายเลขพัสดุ", en: "Save Tracking" },
  "admin.order.cancelled_msg": { th: "คำสั่งซื้อถูกยกเลิกแล้ว", en: "Order has been cancelled" },
  "admin.order.shipped_done": { th: "ลูกค้ารับสินค้าแล้ว ✓", en: "Customer received the Product ✓" },

  // Products panel
  "admin.products.search_placeholder": { th: "ค้นหาสินค้า...", en: "Search products..." },

  // Admin settings save notifications
  "admin.toast.payment_saved": { th: "บันทึกบัญชีรับเงินแล้ว", en: "Payment account saved" },
  "admin.toast.shipping_saved": { th: "บันทึกค่าจัดส่งแล้ว", en: "Shipping rates saved" },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("th");

  useEffect(() => {
    // Sync from localStorage after mount to avoid SSR/client hydration mismatch.
    try {
      const stored = localStorage.getItem("app-lang");
      if (stored === "th" || stored === "en") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(stored);
      }
    } catch {}
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
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
