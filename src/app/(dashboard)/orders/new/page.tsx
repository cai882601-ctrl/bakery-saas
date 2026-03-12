"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_SOURCES, formatCurrency } from "@/lib/constants";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  key: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string>("");
  const [source, setSource] = useState("direct");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { key: "1", productId: null, productName: "", quantity: 1, unitPrice: 0 },
  ]);

  const { data: customersData } = trpc.customers.list.useQuery({ limit: 100 });
  const { data: productsData } = trpc.products.list.useQuery({ activeOnly: true, limit: 100 });
  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      router.push(`/orders/${data.id}`);
    },
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = () => {
    setItems([
      ...items,
      { key: Date.now().toString(), productId: null, productName: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (key: string) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.key !== key));
    }
  };

  const updateItem = (key: string, field: keyof OrderItem, value: unknown) => {
    setItems(
      items.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };

        // Auto-fill from product
        if (field === "productId" && value && productsData) {
          const product = productsData.products.find((p: Record<string, unknown>) => p.id === value);
          if (product) {
            updated.productName = product.name as string;
            updated.unitPrice = parseFloat(product.base_price as string);
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = () => {
    const validItems = items.filter((i) => i.productName && i.quantity > 0 && i.unitPrice > 0);
    if (validItems.length === 0) return;

    createOrder.mutate({
      customerId: customerId || null,
      source,
      deliveryDate: deliveryDate || null,
      deliveryTime: deliveryTime || null,
      deliveryMethod,
      notes: notes || null,
      items: validItems.map((i) => ({
        productId: i.productId || null,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Order</h2>
          <p className="text-muted-foreground">Create a new bakery order.</p>
        </div>
      </div>

      {/* Customer & Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customersData?.customers.map((c: Record<string, unknown>) => (
                    <SelectItem key={c.id as string} value={c.id as string}>
                      {c.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v ?? "direct")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Delivery Date</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Time</Label>
              <Input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={deliveryMethod}
                onValueChange={(v) => setDeliveryMethod(v as "pickup" | "delivery")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Special instructions, decorations, allergies..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Order Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_80px_100px_40px]"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Product</Label>
                <Select
                  value={item.productId ?? "custom"}
                  onValueChange={(v) => updateItem(item.key, "productId", v === "custom" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Item</SelectItem>
                    {productsData?.products.map((p: Record<string, unknown>) => (
                      <SelectItem key={p.id as string} value={p.id as string}>
                        {p.name as string} — {formatCurrency(p.base_price as string)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  placeholder="Item name"
                  value={item.productName}
                  onChange={(e) => updateItem(item.key, "productName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Qty</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.key, "quantity", parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.key, "unitPrice", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.key)}
                  disabled={items.length <= 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="flex justify-end border-t pt-4">
            <div className="w-48 space-y-1 text-right">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/orders">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={createOrder.isPending || !items.some((i) => i.productName && i.unitPrice > 0)}
        >
          {createOrder.isPending ? "Creating..." : "Create Order"}
        </Button>
      </div>

      {createOrder.isError && (
        <p className="text-sm text-destructive">
          Error: {createOrder.error.message}
        </p>
      )}
    </div>
  );
}
