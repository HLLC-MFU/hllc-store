"use client";

import * as React from "react";
import {
  Check,
  ClipboardList,
  Image as ImageIcon,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  X,
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
import { Separator } from "@/components/ui/separator";
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

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  active: boolean;
};

type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

type SlipStatus = "none" | "pending" | "approved" | "rejected";

type Order = {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  total: number;
  status: OrderStatus;
  slip: {
    imageUrl: string;
    amount?: number;
    note?: string;
    status: SlipStatus;
    reviewedBy?: string;
    reviewNote?: string;
  };
  createdAt: string;
};

type ApiResult<T> = {
  data?: T;
  error?: string;
};

const orderStatuses: OrderStatus[] = [
  "pending_payment",
  "payment_review",
  "paid",
  "packing",
  "shipped",
  "completed",
  "cancelled",
];

async function api<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiResult<T>;

  if (!response.ok) {
    return { error: payload.error ?? "Request failed" };
  }

  return payload;
}

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function statusVariant(status: OrderStatus | SlipStatus) {
  if (["paid", "completed", "approved"].includes(status)) {
    return "success";
  }

  if (["cancelled", "rejected"].includes(status)) {
    return "destructive";
  }

  if (["payment_review", "pending"].includes(status)) {
    return "warning";
  }

  return "secondary";
}

export function EcomDashboard() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = React.useState<Product[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [createdOrder, setCreatedOrder] = React.useState<Order | null>(null);

  async function loadStore() {
    const result = await api<Product[]>("/api/backend/products");
    setProducts(result.data ?? []);
    if (result.error) setMessage(result.error);
  }

  async function loadAdmin() {
    const [productResult, orderResult] = await Promise.all([
      api<Product[]>("/api/backend/admin/products"),
      api<Order[]>("/api/backend/admin/orders"),
    ]);

    setAdminProducts(productResult.data ?? []);
    setOrders(orderResult.data ?? []);
    if (productResult.error || orderResult.error) {
      setMessage(productResult.error ?? orderResult.error ?? "");
    }
  }

  React.useEffect(() => {
    let active = true;

    Promise.all([
      api<Product[]>("/api/backend/products"),
      api<Product[]>("/api/backend/admin/products"),
      api<Order[]>("/api/backend/admin/orders"),
    ]).then(([storeResult, productResult, orderResult]) => {
      if (!active) return;

      setProducts(storeResult.data ?? []);
      setAdminProducts(productResult.data ?? []);
      setOrders(orderResult.data ?? []);

      if (storeResult.error || productResult.error || orderResult.error) {
        setMessage(
          storeResult.error ?? productResult.error ?? orderResult.error ?? "",
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function createCustomerOrder(formData: FormData) {
    setLoading(true);
    setMessage("");

    const items = Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    const result = await api<Order>("/api/backend/orders", {
      method: "POST",
      body: JSON.stringify({
        customer: {
          name: formData.get("name"),
          phone: formData.get("phone"),
          address: formData.get("address"),
        },
        items,
      }),
    });

    setLoading(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setCart({});
    setCreatedOrder(result.data ?? null);
    setMessage("Order created. Send payment slip when ready.");
    await loadStore();
    await loadAdmin();
  }

  async function attachSlip(formData: FormData) {
    if (!createdOrder) return;

    setLoading(true);
    const result = await api<Order>(`/api/backend/orders/${createdOrder.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        imageUrl: formData.get("imageUrl"),
        amount: Number(formData.get("amount")),
        note: formData.get("note"),
      }),
    });
    setLoading(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setCreatedOrder(result.data ?? null);
    setMessage("Slip sent to admin review.");
    await loadAdmin();
  }

  async function createAdminProduct(formData: FormData) {
    setLoading(true);
    setMessage("");

    const result = await api<Product>("/api/backend/admin/products", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        price: Number(formData.get("price")),
        stock: Number(formData.get("stock")),
        imageUrl: formData.get("imageUrl"),
      }),
    });

    setLoading(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Product saved to MongoDB.");
    await loadStore();
    await loadAdmin();
  }

  async function reviewSlip(orderId: string, approved: boolean) {
    setLoading(true);
    const result = await api<Order>(`/api/backend/admin/slips/${orderId}`, {
      method: "POST",
      body: JSON.stringify({
        approved,
        reviewedBy: "admin",
      }),
    });
    setLoading(false);

    setMessage(result.error ?? `Slip ${approved ? "approved" : "rejected"}.`);
    await loadAdmin();
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setLoading(true);
    const result = await api<Order>(`/api/backend/admin/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setLoading(false);

    setMessage(result.error ?? "Order status updated.");
    await loadAdmin();
  }

  const total = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find((item) => item.id === productId);
    return sum + (product?.price ?? 0) * quantity;
  }, 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">HLLC Store</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">
            ECOM Operations
          </h1>
        </div>
        <Button
          disabled={loading}
          onClick={() => {
            void loadStore();
            void loadAdmin();
          }}
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </header>

      {message ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
          {message}
        </div>
      ) : null}

      <Tabs defaultValue="store">
        <TabsList>
          <TabsTrigger value="store">
            <ShoppingCart className="mr-2 size-4" />
            User Store
          </TabsTrigger>
          <TabsTrigger value="admin">
            <ShieldCheck className="mr-2 size-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <section className="grid gap-4 md:grid-cols-2">
              {products.length ? (
                products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{product.name}</CardTitle>
                          <CardDescription>{product.slug}</CardDescription>
                        </div>
                        <Badge variant="outline">Stock {product.stock}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="flex aspect-[16/9] items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-400">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={product.name}
                            className="h-full w-full rounded-md object-cover"
                            src={product.imageUrl}
                          />
                        ) : (
                          <ImageIcon className="size-8" />
                        )}
                      </div>
                      <p className="min-h-10 text-sm text-zinc-600">
                        {product.description || "No description"}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <strong>{money(product.price)}</strong>
                        <div className="flex items-center gap-2">
                          <Input
                            className="w-20"
                            min={0}
                            max={product.stock}
                            onChange={(event) =>
                              setCart((current) => ({
                                ...current,
                                [product.id]: Number(event.target.value),
                              }))
                            }
                            type="number"
                            value={cart[product.id] ?? 0}
                          />
                          <Button
                            disabled={product.stock < 1}
                            onClick={() =>
                              setCart((current) => ({
                                ...current,
                                [product.id]: (current[product.id] ?? 0) + 1,
                              }))
                            }
                            size="sm"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>No products from MongoDB</CardTitle>
                    <CardDescription>
                      Add products from the admin tab after setting MONGODB_URI.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </section>

            <aside className="grid content-start gap-5">
              <Card>
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                  <CardDescription>{money(total)} cart total</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={createCustomerOrder} className="grid gap-3">
                    <Field label="Name" name="name" />
                    <Field label="Phone" name="phone" />
                    <Field label="Address" name="address" textarea />
                    <Button disabled={loading || total <= 0} type="submit">
                      <ClipboardList className="size-4" />
                      Create Order
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {createdOrder ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Slip</CardTitle>
                    <CardDescription>Order {createdOrder.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={attachSlip} className="grid gap-3">
                      <Field label="Slip image URL" name="imageUrl" />
                      <Field
                        defaultValue={createdOrder.total}
                        label="Amount"
                        name="amount"
                        type="number"
                      />
                      <Field label="Note" name="note" textarea />
                      <Button disabled={loading} type="submit">
                        Send Slip
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : null}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="admin">
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Add Product</CardTitle>
                <CardDescription>Saved directly to MongoDB</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createAdminProduct} className="grid gap-3">
                  <Field label="Name" name="name" />
                  <Field label="Slug" name="slug" />
                  <Field label="Description" name="description" textarea />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Price" name="price" type="number" />
                    <Field label="Stock" name="stock" type="number" />
                  </div>
                  <Field label="Image URL" name="imageUrl" />
                  <Button disabled={loading} type="submit">
                    <PackagePlus className="size-4" />
                    Save Product
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid gap-5">
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>{adminProducts.length} records</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{money(product.price)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Orders</CardTitle>
                  <CardDescription>Slip review and fulfillment</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {orders.map((order) => (
                    <div
                      className="rounded-md border border-zinc-200 p-4"
                      key={order.id}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>{order.customer.name}</strong>
                            <Badge variant={statusVariant(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge variant={statusVariant(order.slip.status)}>
                              slip {order.slip.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-zinc-500">
                            {order.customer.phone} · {money(order.total)}
                          </p>
                        </div>
                        <select
                          className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
                          onChange={(event) =>
                            void updateStatus(
                              order.id,
                              event.target.value as OrderStatus,
                            )
                          }
                          value={order.status}
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid gap-2 text-sm text-zinc-600">
                        {order.items.map((item) => (
                          <div
                            className="flex justify-between gap-3"
                            key={`${order.id}-${item.productId}`}
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>{money(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                      {order.slip.imageUrl ? (
                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <a
                            className="text-sm font-medium text-zinc-950 underline"
                            href={order.slip.imageUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open slip
                          </a>
                          <div className="flex gap-2">
                            <Button
                              disabled={
                                loading || order.slip.status !== "pending"
                              }
                              onClick={() => void reviewSlip(order.id, true)}
                              size="sm"
                            >
                              <Check className="size-4" />
                              Approve
                            </Button>
                            <Button
                              disabled={
                                loading || order.slip.status !== "pending"
                              }
                              onClick={() => void reviewSlip(order.id, false)}
                              size="sm"
                              variant="destructive"
                            >
                              <X className="size-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {!orders.length ? (
                    <p className="text-sm text-zinc-500">No orders yet.</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Field({
  label,
  name,
  textarea,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  textarea?: boolean;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {textarea ? (
        <Textarea defaultValue={defaultValue} id={name} name={name} />
      ) : (
        <Input defaultValue={defaultValue} id={name} name={name} type={type} />
      )}
    </div>
  );
}
