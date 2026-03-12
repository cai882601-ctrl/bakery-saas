"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/constants";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  ShoppingBag,
  Trash2,
  User,
  Wallet,
} from "lucide-react";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: customer, isLoading } = trpc.customers.getById.useQuery({ id });
  const { data: ordersData } = trpc.orders.list.useQuery({ customerId: id });
  const { data: stats } = trpc.customers.getStats.useQuery({ id });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.getById.invalidate({ id });
      utils.customers.list.invalidate();
      setEditOpen(false);
    },
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      router.push("/customers");
    },
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  function openEditDialog() {
    if (!customer) return;
    const c = customer as Record<string, unknown>;
    setEditForm({
      name: (c.name as string) ?? "",
      email: (c.email as string) ?? "",
      phone: (c.phone as string) ?? "",
      address: (c.address as string) ?? "",
      notes: (c.notes as string) ?? "",
    });
    setEditOpen(true);
  }

  function handleSave() {
    updateCustomer.mutate({
      id,
      name: editForm.name,
      email: editForm.email || null,
      phone: editForm.phone || null,
      address: editForm.address || null,
      notes: editForm.notes || null,
    });
  }

  function handleDelete() {
    deleteCustomer.mutate({ id });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Customer not found.</p>
        <Link href="/customers">
          <Button variant="outline">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const c = customer as Record<string, unknown>;
  const orders = (ordersData?.orders ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {c.name as string}
            </h2>
            <p className="text-sm text-muted-foreground">
              Customer since {formatDate(c.created_at as string)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!editForm.name || updateCustomer.isPending}
                >
                  {updateCustomer.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {!deleteConfirm ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteCustomer.isPending}
                onClick={handleDelete}
              >
                {deleteCustomer.isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Customer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{c.name as string}</p>
                <p className="text-xs text-muted-foreground">Name</p>
              </div>
            </div>

            {c.email ? (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{c.email as string}</p>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
              </div>
            ) : null}

            {c.phone ? (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{c.phone as string}</p>
                  <p className="text-xs text-muted-foreground">Phone</p>
                </div>
              </div>
            ) : null}

            {c.address ? (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{c.address as string}</p>
                  <p className="text-xs text-muted-foreground">Address</p>
                </div>
              </div>
            ) : null}

            <Separator />

            <div className="flex items-start gap-3">
              <ShoppingBag className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">
                  {c.source as string}
                </p>
                <p className="text-xs text-muted-foreground">Source</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {formatDate(c.created_at as string)}
                </p>
                <p className="text-xs text-muted-foreground">Customer Since</p>
              </div>
            </div>

            {c.notes ? (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{c.notes as string}</p>
                    <p className="text-xs text-muted-foreground">Notes</p>
                  </div>
                </div>
              </>
            ) : null}

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stats?.totalOrders ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {formatCurrency(stats?.totalSpent ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {formatCurrency(stats?.avgOrderValue ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">Avg Order</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-sm">
                  {stats?.lastOrderDate ? formatDate(stats.lastOrderDate) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Last Order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No orders yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id as string}>
                      <TableCell>
                        <Link
                          href={`/orders/${order.id as string}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.order_number as string}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status as string} />
                      </TableCell>
                      <TableCell>
                        {formatDate(order.created_at as string)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total as string)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
