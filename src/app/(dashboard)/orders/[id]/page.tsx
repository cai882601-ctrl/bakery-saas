"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { STATUS_FLOW, formatCurrency, formatDate, getStatusInfo } from "@/lib/constants";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  User,
  Truck,
} from "lucide-react";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id });
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.getById.invalidate({ id });
      utils.orders.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleStripeCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Failed to create checkout session");
      }
    } catch {
      alert("Failed to create checkout session");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const nextStatuses = STATUS_FLOW[order.status as string] ?? [];
  const customer = order.customers as Record<string, string> | null;
  const orderItems = (order.order_items ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {order.order_number as string}
              </h2>
              <StatusBadge status={order.status as string} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDate(order.created_at as string)}
            </p>
          </div>
        </div>

        {/* Status actions */}
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((nextStatus) => {
            const info = getStatusInfo(nextStatus);
            return (
              <Button
                key={nextStatus}
                variant={nextStatus === "cancelled" ? "outline" : "default"}
                size="sm"
                disabled={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate({
                    id,
                    status: nextStatus as "pending" | "confirmed" | "in_progress" | "ready" | "delivered" | "cancelled",
                  })
                }
                className={nextStatus === "cancelled" ? "text-destructive" : ""}
              >
                {nextStatus === "cancelled" ? "Cancel" : `Mark as ${info.label}`}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Order Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {customer?.name ?? "Walk-in Customer"}
                </p>
                {customer?.email && (
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                )}
                {customer?.phone && (
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Package className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">
                  {order.source as string}
                </p>
                <p className="text-xs text-muted-foreground">Order Source</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {formatDate(order.delivery_date as string | null)}
                </p>
                <p className="text-xs text-muted-foreground">Delivery Date</p>
              </div>
            </div>

            {order.delivery_time && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {order.delivery_time as string}
                  </p>
                  <p className="text-xs text-muted-foreground">Delivery Time</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">
                  {order.delivery_method as string}
                </p>
                <p className="text-xs text-muted-foreground">Delivery Method</p>
              </div>
            </div>

            {order.notes && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{order.notes as string}</p>
                    <p className="text-xs text-muted-foreground">Notes</p>
                  </div>
                </div>
              </>
            )}

            {order.paid_at && (
              <>
                <Separator />
                <Badge variant="secondary" className="w-full justify-center">
                  Paid on {formatDate(order.paid_at as string)}
                </Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Items ({orderItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id as string}>
                    <TableCell>
                      <p className="font-medium">{item.product_name as string}</p>
                      {item.customizations ? (
                        <p className="text-xs text-muted-foreground">
                          {item.customizations as string}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity as number}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_price as string)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total_price as string)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="border-t p-4">
              <div className="flex flex-col items-end gap-1">
                <div className="flex w-48 justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal as string)}</span>
                </div>
                {parseFloat(order.tax as string) > 0 && (
                  <div className="flex w-48 justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(order.tax as string)}</span>
                  </div>
                )}
                {parseFloat(order.delivery_fee as string) > 0 && (
                  <div className="flex w-48 justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>{formatCurrency(order.delivery_fee as string)}</span>
                  </div>
                )}
                <Separator className="my-1 w-48" />
                <div className="flex w-48 justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total as string)}</span>
                </div>
                {!order.paid_at && order.status !== "cancelled" && (
                  <Button
                    className="mt-3 w-48"
                    onClick={handleStripeCheckout}
                    disabled={isCheckoutLoading}
                  >
                    {isCheckoutLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    {isCheckoutLoading ? "Redirecting…" : "Pay with Stripe"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
