"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ORDER_STATUSES, formatCurrency, formatDate } from "@/lib/constants";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

type SortField = "created_at" | "total" | "delivery_date";

export default function OrdersPage() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = trpc.orders.list.useQuery({
    status: status || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 20,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            {data ? `${data.total} total orders` : "Loading..."}
          </p>
        </div>
        <Link href="/orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order # or customer..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v === "all" || v === null ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button
                    className="flex h-full w-full items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("total")}
                  >
                    Total
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button
                    className="flex h-full w-full items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("delivery_date")}
                  >
                    Delivery
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <button
                    className="flex h-full w-full items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("created_at")}
                  >
                    Created
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : !data?.orders.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {search || status
                      ? "No orders match your filters."
                      : "No orders yet. Create your first order to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                data.orders.map((order: Record<string, unknown>) => (
                  <TableRow key={order.id as string} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.order_number as string}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {(order.customers as Record<string, string> | null)?.name ?? "Walk-in"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize">
                      {order.source as string}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status as string} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total as string)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(order.delivery_date as string | null)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(order.created_at as string)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
