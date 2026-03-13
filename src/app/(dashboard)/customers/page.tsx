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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CUSTOMER_SOURCES, formatCurrency, formatDate } from "@/lib/constants";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown, Download } from "lucide-react";

type SortField = "name" | "total_orders" | "total_spent" | "created_at";

export default function CustomersPage() {
  const [source, setSource] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = trpc.customers.list.useQuery({
    source: source || undefined,
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

  const handleExportCsv = () => {
    if (!data?.customers.length) return;
    const headers = ["Name", "Email", "Phone", "Address", "Source", "Created At"];
    const rows = data.customers.map((c: Record<string, unknown>) => [
      c.name as string,
      (c.email as string) || "",
      (c.phone as string) || "",
      (c.address as string) || "",
      (c.source as string) || "",
      (c.created_at as string) || "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            {data ? `${data.total} total customers` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={!data?.customers.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Link href="/customers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by name, email, or phone..."
                aria-label="Search customers"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v === "all" || v === null ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by source">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {CUSTOMER_SOURCES.map((s) => (
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
                <TableHead aria-sort={getAriaSort(sortBy, "name", sortOrder)}>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("name")}
                    aria-label="Sort by name"
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead aria-sort={getAriaSort(sortBy, "total_orders", sortOrder)}>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("total_orders")}
                    aria-label="Sort by number of orders"
                  >
                    Orders
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead aria-sort={getAriaSort(sortBy, "total_spent", sortOrder)}>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort("total_spent")}
                    aria-label="Sort by total spent"
                  >
                    Spent
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell" aria-sort={getAriaSort(sortBy, "created_at", sortOrder)}>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
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
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : !data?.customers.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {search || source
                      ? "No customers match your filters."
                      : "No customers yet. Add your first customer to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                data.customers.map((customer: Record<string, unknown>) => (
                  <TableRow key={customer.id as string} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {customer.name as string}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {(customer.email as string) || "--"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {(customer.phone as string) || "--"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="capitalize">
                        {customer.source as string}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.total_orders as number}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(customer.total_spent as string)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(customer.created_at as string)}
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
