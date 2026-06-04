# HLLC Store — Changelog (Session Summary)

> tsc = 0 · lint = 0 · build ✅

---

## Phase 1 — Dead Code & Lint

### ลบไฟล์ที่ไม่ได้ใช้งาน
| ไฟล์ที่ลบ | เหตุผล |
|-----------|--------|
| `components/admin/edit-product-modal.tsx` | ไม่มี import ใดเรียกใช้ |
| `components/admin/product-stat-card.tsx` | ไม่มี import ใดเรียกใช้ |
| `components/admin/admin-bottom-nav.tsx` | ไม่มี import ใดเรียกใช้ |
| `components/shop/page-header.tsx` | ไม่มี import ใดเรียกใช้ |
| `components/shop/order-sheet.tsx` | 797 บรรทัด — superseded โดย `cart/page.tsx` |
| `.claude/worktrees/agent-ac94122addc8a82b3/` | stale git worktree ค้างจาก agent เก่า |

### Product dead code ใน ecom-service
- ลบฟังก์ชัน `listProducts`, `createProduct`, `getProduct`, `updateProduct`, `deleteProduct`, `toProduct`, `createSlug` ออกจาก `ecom-service.ts` (~210 บรรทัด)
- เหตุผล: ซ้ำกับ `lib/backend/products/product-service.ts` ที่ใช้จริง
- **Rename** `lib/backend/ecom-service.ts` → `lib/backend/order-service.ts` ให้ชื่อสื่อ domain ที่ถูกต้อง

### Lint: 0 warnings
- ลบ unused imports: `Button`, `ShoppingCart`, `Send`, `Card`, `CardContent`, `Input`, `EmailInput`, `Filter`, `MapPin`, `Phone` ฯลฯ
- ลบ unused variables: `buyProductNow`, `mounted`, `loading`, `auditDetail` ฯลฯ
- เพิ่ม `eslint-disable` สำหรับ `<img>` ใน admin (ไม่ใช้ Next/Image โดยตั้งใจ)

---

## Phase 2 — Security

### C1 🔴 `/api/send-email` — เพิ่ม Auth + Rate Limit
**ก่อน:** ใครก็ส่งอีเมลผ่านระบบได้ = open relay / spam abuse
**แก้:**
- เพิ่ม `requireAdmin()` — ต้องเป็น admin ถึงใช้ได้
- เพิ่ม rate limit 10 ครั้ง/60 วินาที ต่อ IP
- เพิ่ม `csrfHeaders()` helper ใน `api-client.ts` และใช้ใน admin fetch

### C2 🟠 `/api/backend/admin/register` — เพิ่ม Rate Limit
**ก่อน:** brute-force ตั้งรหัสผ่านได้ไม่จำกัด
**แก้:** rate limit 5 ครั้ง/60 วินาที ต่อ IP

### C3 🟠 Rate Limit Shared Helper
**ก่อน:** rate limit ฝังอยู่ใน auth route เดียว อิง `x-forwarded-for` ตัวแรก (ปลอมได้)
**แก้:** สร้าง `lib/backend/rate-limit.ts`
- shared `rateLimit(request, { bucket, windowMs, max })` ใช้ได้ทุก route
- อ่าน IP จาก `x-forwarded-for` ตัวท้าย (ที่ trusted proxy append จริง) แทนตัวแรก
- Cleanup interval อัตโนมัติทุก 5 นาที ป้องกัน memory leak
- เพิ่ม `tooManyRequests()` helper ใน `http.ts` พร้อม `Retry-After` header

### C4 🟡 ลบ PII จาก Public Order Lookup
**ก่อน:** `GET /api/backend/orders?customerPhone=xxx` คืน email + ที่อยู่เต็ม + admin notes
**แก้:**
- เพิ่ม `PublicOrder` type ใน `lib/backend/types.ts`
- สร้าง `toPublicOrder()` ใน `order-service.ts` — strip email, address, adminNotes, slip reviewer
- ใช้ใน route `GET /orders`, `GET /orders/[orderId]`, `PATCH /orders/[orderId]`
- หน้า profile ปรับ type ให้รับเฉพาะ `{ name, phone }` แทน customer เต็ม

---

## Phase 3 — โครงสร้าง

### E: Rename `admin/utils.ts` → `admin/api-client.ts`
ชื่อเดิมสื่อไม่ชัด — ไฟล์นี้คือ API client helper (`api()`, `csrfHeaders()`, `money()`, `timeAgo()`, `isPickupOrder()`)
อัปเดต imports ทุกไฟล์ที่เรียกใช้

### F: จัดระเบียบ `lib/` root
**ก่อน:** ไฟล์ client-side, validation, data ปนกันใน `lib/` root
```
lib/
├── cart.tsx              # client
├── cart-fly.tsx          # client
├── language-context.tsx  # client
├── schemas.ts            # validation
├── schemas-i18n.ts       # validation
├── validation.ts         # validation
└── thai-provinces.ts     # data
```

**หลัง:** แยก concern ชัดเจน
```
lib/
├── client/
│   ├── cart.tsx
│   ├── cart-fly.tsx
│   └── language-context.tsx
├── validation/
│   ├── schemas.ts
│   ├── schemas-i18n.ts
│   └── validation.ts
├── data/
│   └── thai-provinces.ts
└── backend/
    ├── order-service.ts    (เดิม ecom-service.ts)
    ├── rate-limit.ts       (ใหม่)
    ├── admin-auth.ts
    ├── admin-user-service.ts
    ├── email-service.ts
    ├── http.ts
    ├── mongodb.ts
    ├── request-utils.ts
    ├── types.ts
    └── products/
```
อัปเดต imports ทั้งหมด ~50 ไฟล์

---

## Phase 4 — แตกไฟล์ใหญ่

### cart/page.tsx: 773 → ~200 บรรทัด
แยกออกเป็น components ใน `app/(shop)/cart/components/`:

| Component | หน้าที่ |
|-----------|---------|
| `CartSummaryPanel.tsx` | ช่องสรุปราคา + toggle delivery/pickup + ปุ่มชำระ |
| `PaymentStep.tsx` | หน้าโอนเงิน — แสดงเลขบัญชี + upload สลิป |
| `InfoStep.tsx` | ฟอร์มกรอกข้อมูลผู้รับ + ที่อยู่ + จังหวัด |
| `CartModals.tsx` | `ConfirmOrderModal` + `RemoveItemModal` |

`cart/page.tsx` เหลือแค่ state management + orchestration

### admin/page.tsx: 735 → ~480 บรรทัด
แยก 2 tab ออกเป็น components ใน `components/admin/`:

| Component | หน้าที่ |
|-----------|---------|
| `email-panel.tsx` | Email Mockup tab — form + preview |
| `super-admin-panel.tsx` | SuperAdmin tab — create account + users list + audit logs |

---

## Feature Changes (ก่อนหน้า Phase 1-4)

### Admin
- **Orders tab** — tab "ทั้งหมด" แสดงทุก state รวม completed
- **Status badge** แทน mini stepper ใน order card (อ่านง่ายกว่า)
- **ShippingLabel** — ใบติดพัสดุ พิมพ์ได้ แสดงใน admin เมื่อ order เป็น delivery
- **Tracking validation** — ปุ่มไป state ต่อไปต้องกรอก tracking number ก่อน
- **Slip review view** — ซ่อน shipping label ระหว่างตรวจสลิป
- **Password toggle** (Eye/EyeOff) ในหน้า login และ register

### Shop / Cart
- **Province combobox** — ใช้ `@base-ui-components/react` + shadcn API
- **Product list** — ลบปุ่ม "ซื้อเลย" และ "ตะกร้า" ออกจากหน้าหลัก (กด card เข้าไปสั่งแทน)
- **Add product form** — ลบ options field ออก (ระบบไม่ใช้แล้ว)

### Order Tracking (Profile)
- **Redesign หน้าติดตาม** — Hero status ใหญ่ + vertical timeline + tracking number copy
- **Collapsed cards** — กดขยายดูรายละเอียด ย่อเมื่อมีหลาย order
- **Left accent bar** สีตาม state — เหลือง/ฟ้า/เขียว/แดง
- **Status ขวา** แทนราคา (user จ่ายแล้ว state สำคัญกว่า)

### Admin Register page
- เปลี่ยน theme จาก dark → light ให้ตรงกับหน้า login
- ปุ่ม "ตั้งรหัสผ่านสำหรับบัญชีใหม่" เป็น outline button

---

## สรุป Metrics

| หมวด | ก่อน | หลัง |
|------|------|------|
| TypeScript errors | 0 | 0 |
| ESLint warnings | 77 | 0 |
| Unused components | 4+ | 0 |
| Largest file (บรรทัด) | 797 | ~480 |
| Dead code (บรรทัด) | ~1,000+ | ~0 |
| Security issues | 4 | 0 |
| `lib/` structure | flat | client/ validation/ data/ backend/ |
