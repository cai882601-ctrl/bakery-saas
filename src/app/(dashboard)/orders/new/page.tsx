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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_SOURCES, formatCurrency } from "@/lib/constants";
import { ArrowLeft, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
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
  const [customerOpen, setCustomerOpen] = useState(false);
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
          <Button variant="ghost" size="icon" aria-label="Go back to orders">
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
              <Label id="customer-label">Customer</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger
                  aria-labelledby="customer-label"
                  className="flex h-11 lg:h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-base lg:text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <span className="truncate">
                    {customerId === "walk-in"
                      ? "Walk-in Customer"
                      : customerId
                        ? (customersData?.customers.find(
                            (c: Record<string, unknown>) => c.id === customerId
                          )?.name as string) ?? "Select customer..."
                        : "Select customer (optional)"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name, email, phone..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="walk-in"
                          data-checked={customerId === "walk-in" || undefined}
                          onSelect={() => {
                            setCustomerId("walk-in");
                            setCustomerOpen(false);
                          }}
                        >
                          Walk-in Customer
                        </CommandItem>
                        {customersData?.customers.map((c: Record<string, unknown>) => (
                          <CommandItem
                            key={c.id as string}
                            value={`${c.name as string} ${(c.email as string) || ""} ${(c.phone as string) || ""}`}
                            data-checked={customerId === (c.id as string) || undefined}
                            onSelect={() => {
                              setCustomerId(c.id as string);
                              setCustomerOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{c.name as string}</span>
                              {(c.phone || c.email) ? (
                                <span className="text-xs text-muted-foreground">
                                  {[c.phone as string, c.email as string].filter(Boolean).join(" · ")}
                                </span>
                              ) : null}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-source">Order Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v ?? "direct")}>
                <SelectTrigger id="order-source" aria-label="Order Source">
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
              <Label htmlFor="delivery-date">Delivery Date</Label>
              <Input
                id="delivery-date"
                type="date"
                lang="en"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-time">Delivery Time</Label>
              <Input
                id="delivery-time"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-method">Method</Label>
              <Select
                value={deliveryMethod}
                onValueChange={(v) => setDeliveryMethod(v as "pickup" | "delivery")}
              >
                <SelectTrigger id="delivery-method" aria-label="Delivery Method">
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
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
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_80px_100px_40px]"
              role="group"
              aria-label={`Order item ${idx + 1}`}
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground" htmlFor={`product-${item.key}`}>Product</Label>
                <Select
                  value={item.productId ?? "custom"}
                  onValueChange={(v) => updateItem(item.key, "productId", v === "custom" ? null : v)}
                >
                  <SelectTrigger id={`product-${item.key}`} aria-label="Select product">
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
                <Label className="text-xs text-muted-foreground" htmlFor={`name-${item.key}`}>Name</Label>
                <Input
                  id={`name-${item.key}`}
                  placeholder="Item name"
                  value={item.productName}
                  onChange={(e) => updateItem(item.key, "productName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground" htmlFor={`qty-${item.key}`}>Qty</Label>
                <Input
                  id={`qty-${item.key}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.key, "quantity", parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground" htmlFor={`price-${item.key}`}>Price</Label>
                <Input
                  id={`price-${item.key}`}
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
                  aria-label={`Remove item ${idx + 1}`}
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
