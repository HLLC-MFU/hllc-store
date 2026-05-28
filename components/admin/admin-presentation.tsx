"use client";

import * as React from "react";
import {
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  Mail,
  Package,
  PackagePlus,
  Search,
  Settings2,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type OrderStatus =
  | "pending slip"
  | "paid"
  | "packing"
  | "shipped"
  | "cancelled";

type Product = {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  description: string;
  price: number;
  stock: number;
};

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  productName: string;
  slipUrl: string;
  slipStatus: "pending" | "approved" | "rejected";
  createdAt: string;
};

const orderStatuses: OrderStatus[] = [
  "pending slip",
  "paid",
  "packing",
  "shipped",
  "cancelled",
];

const initialProducts: Product[] = [
  {
    id: "prd-001",
    name: "HLLC Signature Hoodie",
    sku: "HLLC-HD-001",
    imageUrl:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
    description: "Regular fit hoodie with heavyweight fabric and logo embroidery.",
    price: 1290,
    stock: 18,
  },
  {
    id: "prd-002",
    name: "Minimal Logo Tee",
    sku: "HLLC-TS-014",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    description: "100% cotton daily tee with a small logo print.",
    price: 590,
    stock: 42,
  },
  {
    id: "prd-003",
    name: "Canvas Tote Bag",
    sku: "HLLC-BG-006",
    imageUrl:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
    description: "Durable canvas tote with a large main compartment.",
    price: 390,
    stock: 25,
  },
];

const initialOrders: Order[] = [
  {
    id: "ORD-2401",
    customerName: "Narin Ch.",
    customerEmail: "narin@example.com",
    total: 1880,
    status: "pending slip",
    productName: "HLLC Signature Hoodie, Minimal Logo Tee",
    slipUrl: "/image.png",
    slipStatus: "pending",
    createdAt: "28 May 2026, 10:12",
  },
  {
    id: "ORD-2402",
    customerName: "Ploy K.",
    customerEmail: "ploy@example.com",
    total: 390,
    status: "packing",
    productName: "Canvas Tote Bag",
    slipUrl: "/image.png",
    slipStatus: "approved",
    createdAt: "28 May 2026, 09:48",
  },
  {
    id: "ORD-2403",
    customerName: "Win T.",
    customerEmail: "win@example.com",
    total: 1290,
    status: "shipped",
    productName: "HLLC Signature Hoodie",
    slipUrl: "/image.png",
    slipStatus: "approved",
    createdAt: "27 May 2026, 18:20",
  },
];

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusVariant(status: OrderStatus | Order["slipStatus"]) {
  if (["paid", "shipped", "approved"].includes(status)) return "success";
  if (["cancelled", "rejected"].includes(status)) return "destructive";
  if (["pending slip", "pending"].includes(status)) return "warning";
  return "secondary";
}

export function AdminPresentation() {
  const [products, setProducts] = React.useState(initialProducts);
  const [orders, setOrders] = React.useState(initialOrders);
  const [search, setSearch] = React.useState("");

  const filteredOrders = orders.filter((order) =>
    [order.id, order.customerName, order.productName]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function addProduct(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const sku = String(formData.get("sku") ?? "").trim();
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));

    if (!name || !sku || !price) {
      return;
    }

    setProducts((current) => [
      {
        id: `prd-${String(current.length + 1).padStart(3, "0")}`,
        name,
        sku,
        imageUrl,
        description,
        price,
        stock,
      },
      ...current,
    ]);
  }

  function updateOrder(orderId: string, status: OrderStatus) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  function reviewSlip(orderId: string, approved: boolean) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              slipStatus: approved ? "approved" : "rejected",
              status: approved ? "paid" : "pending slip",
            }
          : order,
      ),
    );
  }

  function mockSendEmail(order: Order) {
    console.info(`Mock email sent to ${order.customerEmail} for ${order.id}.`);
  }

  return (
    <main className="min-h-screen bg-[#dcecff] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-24 pt-3 sm:px-4 sm:py-6 md:px-8">
        <header className="sticky top-0 z-20 -mx-3 border-b border-white/70 bg-[#dcecff]/95 px-3 pb-3 pt-2 backdrop-blur sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:pb-4 sm:pt-0 md:flex md:items-end md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full bg-white shadow-sm ring-1 ring-blue-100">
                <Package className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Welcome back
                </p>
                <h1 className="text-xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                  HLLC Admin
                </h1>
              </div>
            </div>
            <Button className="rounded-full bg-white text-slate-900 shadow-sm hover:bg-blue-50 md:hidden" size="icon" variant="ghost">
              <Settings2 className="size-5" />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm sm:gap-3 md:mt-0">
            <Metric label="Orders" tone="blue" value={orders.length} />
            <Metric label="Products" tone="violet" value={products.length} />
            <Metric
              label="Pending"
              tone="amber"
              value={orders.filter((order) => order.slipStatus === "pending").length}
            />
          </div>
        </header>

        <Tabs defaultValue="orders">
          <TabsList className="hidden h-auto w-full grid-cols-2 gap-1 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-blue-100 sm:grid md:w-96">
            <TabsTrigger
              className="h-10 rounded-full data-[state=active]:bg-blue-600"
              value="orders"
            >
              <ClipboardList className="size-4" />
              <span className="text-sm">Orders</span>
            </TabsTrigger>
            <TabsTrigger
              className="h-10 rounded-full"
              value="products"
            >
              <Package className="size-4" />
              <span className="text-sm">Products</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="border-white/80 bg-white/90 shadow-sm shadow-blue-200/40">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">Order Management</CardTitle>
                    <CardDescription>
                      Review slips, update status, and notify customers.
                    </CardDescription>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="pointer-events-none absolute left-3 top-3 size-4 text-blue-400" />
                    <Input
                      className="rounded-full border-white bg-white pl-9 shadow-sm ring-1 ring-blue-100 focus:border-blue-300"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search order, customer, product"
                      value={search}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 lg:hidden">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      mockSendEmail={mockSendEmail}
                      order={order}
                      reviewSlip={reviewSlip}
                      updateOrder={updateOrder}
                    />
                  ))}
                </div>

                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <React.Fragment key={order.id}>
                          <TableRow>
                            <TableCell>
                              <div className="font-medium">{order.id}</div>
                              <div className="text-xs text-zinc-500">
                                {order.createdAt}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>{order.customerName}</div>
                              <div className="text-xs text-zinc-500">
                                {order.customerEmail}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-56 text-zinc-600">
                              {order.productName}
                            </TableCell>
                            <TableCell>{money(order.total)}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(order.status)}>
                                {order.status}
                              </Badge>
                              <div className="mt-1">
                                <Badge variant={statusVariant(order.slipStatus)}>
                                  slip {order.slipStatus}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusSelect order={order} updateOrder={updateOrder} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={6}>
                              <SlipReview
                                compact
                                mockSendEmail={mockSendEmail}
                                order={order}
                                reviewSlip={reviewSlip}
                                updateOrder={updateOrder}
                              />
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
              <Card className="border-white/80 bg-white/90 shadow-sm shadow-blue-200/40">
                <CardHeader>
                  <CardTitle>Add Product</CardTitle>
                  <CardDescription>
                    Mock product form for image, detail, price, and stock.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={addProduct} className="grid gap-3">
                    <Field label="Product name" name="name" />
                    <Field label="SKU" name="sku" />
                    <Field label="Image URL" name="imageUrl" />
                    <Field label="Description" name="description" textarea />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Price" name="price" type="number" />
                      <Field label="Stock" name="stock" type="number" />
                    </div>
                    <Button type="submit">
                      <PackagePlus className="size-4" />
                      Add Product
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <section className="grid gap-3 sm:grid-cols-2">
                {products.map((product) => (
                  <Card className="border-white/80 bg-white/90 shadow-sm shadow-blue-200/40" key={product.id}>
                    <CardContent className="grid gap-3 p-3 sm:gap-4 sm:p-4">
                      <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 text-zinc-400">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={product.name}
                            className="h-full w-full object-cover"
                            src={product.imageUrl}
                          />
                        ) : (
                          <ImageIcon className="size-8" />
                        )}
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-xs text-zinc-500">{product.sku}</p>
                          </div>
                          <Badge variant="outline">Stock {product.stock}</Badge>
                        </div>
                        <p className="text-sm leading-6 text-zinc-600">
                          {product.description}
                        </p>
                        <strong>{money(product.price)}</strong>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            </div>
          </TabsContent>

          <TabsList className="fixed inset-x-4 bottom-4 z-30 grid h-16 grid-cols-2 rounded-[28px] bg-white/95 p-2 shadow-xl shadow-blue-300/40 ring-1 ring-blue-100 backdrop-blur sm:hidden">
            <TabsTrigger className="h-12 flex-col gap-1 rounded-2xl" value="orders">
              <ClipboardList className="size-5" />
              <span className="text-[11px]">Orders</span>
            </TabsTrigger>
            <TabsTrigger className="h-12 flex-col gap-1 rounded-2xl" value="products">
              <Package className="size-5" />
              <span className="text-[11px]">Products</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </main>
  );
}

function OrderCard({
  mockSendEmail,
  order,
  reviewSlip,
  updateOrder,
}: {
  mockSendEmail: (order: Order) => void;
  order: Order;
  reviewSlip: (orderId: string, approved: boolean) => void;
  updateOrder: (orderId: string, status: OrderStatus) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/95 p-4 shadow-sm shadow-blue-200/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{order.id}</div>
          <div className="text-xs text-zinc-500">{order.createdAt}</div>
        </div>
        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">
                Customer
              </div>
              <div className="mt-1 font-medium">{order.customerName}</div>
              <div className="text-xs text-slate-500">{order.customerEmail}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium uppercase text-slate-400">
                Total
              </div>
              <strong className="mt-1 block text-blue-700">
                {money(order.total)}
              </strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50/80 p-3">
          <div className="text-xs font-medium uppercase text-blue-400">Items</div>
          <div className="mt-1 text-slate-700">{order.productName}</div>
        </div>

        <div className="grid gap-2">
          <Label>Status</Label>
          <StatusSelect order={order} updateOrder={updateOrder} />
        </div>

        <SlipReview
          mockSendEmail={mockSendEmail}
          order={order}
          reviewSlip={reviewSlip}
          updateOrder={updateOrder}
        />
      </div>
    </div>
  );
}

function StatusSelect({
  order,
  updateOrder,
}: {
  order: Order;
  updateOrder: (orderId: string, status: OrderStatus) => void;
}) {
  return (
    <Select
      onValueChange={(value) => updateOrder(order.id, value as OrderStatus)}
      value={order.status}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {orderStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            <span className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  status === "paid" || status === "shipped"
                    ? "bg-emerald-500"
                    : status === "cancelled"
                      ? "bg-red-500"
                      : status === "pending slip"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                }`}
              />
              {status}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SlipReview({
  compact,
  mockSendEmail,
  order,
  reviewSlip,
  updateOrder,
}: {
  compact?: boolean;
  mockSendEmail: (order: Order) => void;
  order: Order;
  reviewSlip: (orderId: string, approved: boolean) => void;
  updateOrder: (orderId: string, status: OrderStatus) => void;
}) {
  return (
    <div
      className={`mt-1 grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-3 ${
        compact ? "lg:grid-cols-[220px_1fr]" : ""
      } border-blue-100 bg-blue-50/70`}
    >
      <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`Slip for ${order.id}`}
          className="h-44 w-full object-cover"
          src={order.slipUrl}
        />
      </div>
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium">Payment slip</div>
            <div className="text-xs text-zinc-500">{money(order.total)}</div>
          </div>
          <Badge variant={statusVariant(order.slipStatus)}>
            {order.slipStatus}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button onClick={() => reviewSlip(order.id, true)} size="sm">
            <CheckCircle2 className="size-4" />
            Approve
          </Button>
          <Button
            onClick={() => reviewSlip(order.id, false)}
            size="sm"
            variant="destructive"
          >
            <XCircle className="size-4" />
            Reject
          </Button>
          <Button onClick={() => mockSendEmail(order)} size="sm" variant="outline">
            <Mail className="size-4" />
            Email
          </Button>
          <Button
            onClick={() => updateOrder(order.id, "shipped")}
            size="sm"
            variant="secondary"
          >
            <Truck className="size-4" />
            Shipped
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "amber" | "blue" | "violet";
  value: number;
}) {
  const styles = {
    amber: "from-amber-50 to-orange-100 text-amber-700 ring-amber-200",
    blue: "from-blue-50 to-sky-100 text-blue-700 ring-blue-200",
    violet: "from-violet-50 to-fuchsia-100 text-violet-700 ring-violet-200",
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br px-3 py-3 shadow-sm ring-1 ${styles[tone]} sm:px-4`}
    >
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="mt-1 text-xl font-semibold sm:text-2xl">{value}</div>
    </div>
  );
}

function Field({
  label,
  name,
  textarea,
  type = "text",
}: {
  label: string;
  name: string;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {textarea ? (
        <Textarea id={name} name={name} />
      ) : (
        <Input id={name} name={name} type={type} />
      )}
    </div>
  );
}
