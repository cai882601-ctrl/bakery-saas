"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { getAriaSort } from "@/lib/utils";
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by order # or customer..."
                aria-label="Search orders"
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
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by status">
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

      {/* Table (Desktop) / Cards (Mobile) */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="divide-y sm:hidden">
            {isLoading ? (
              <div className="p-8 text-center">Loading orders...</div>
            ) : !data?.orders.length ? (
              <div className="p-8 text-center text-muted-foreground">
                {search || status
                  ? "No orders match your filters."
                  : "No orders yet."}
              </div>
            ) : (
              data.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex flex-col gap-2 p-4 active:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      {order.order_number}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {order.customers?.name ?? "Walk-in"}
                    </span>
                    <span className="font-bold">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {order.delivery_date
                        ? `Delivery: ${formatDate(order.delivery_date)}`
                        : "No delivery date"}
                    </span>
                    <span className="capitalize">{order.source}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead aria-sort={getAriaSort(sortBy, "total", sortOrder)}>
                    <button
                      className="flex h-full w-full items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("total")}
                      aria-label="Sort by total"
                    >
                      Total
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </TableHead>
                  <TableHead
                    className="hidden sm:table-cell"
                    aria-sort={getAriaSort(sortBy, "delivery_date", sortOrder)}
                  >
                    <button
                      className="flex h-full w-full items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("delivery_date")}
                      aria-label="Sort by delivery date"
                    >
                      Delivery
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </TableHead>
                  <TableHead
                    className="hidden lg:table-cell"
                    aria-sort={getAriaSort(sortBy, "created_at", sortOrder)}
                  >
                    <button
                      className="flex h-full w-full items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("created_at")}
                      aria-label="Sort by creation date"
                    >
                      Created
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
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
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {search || status
                        ? "No orders match your filters."
                        : "No orders yet. Create your first order to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {order.customers?.name ?? "Walk-in"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize">
                        {order.source}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(order.delivery_date)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatDate(order.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
              aria-label="Go to previous page"
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              aria-label="Go to next page"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
