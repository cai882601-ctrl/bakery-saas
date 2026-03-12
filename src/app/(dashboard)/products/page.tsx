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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_CATEGORIES, formatCurrency } from "@/lib/constants";
import { Plus, Search } from "lucide-react";

export default function ProductsPage() {
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = trpc.products.list.useQuery({
    category: category || undefined,
    activeOnly: false,
    limit: 100,
  });

  const products = (data?.products ?? []) as Array<Record<string, unknown>>;

  const filtered = products.filter((p) => {
    if (!search) return true;
    const name = (p.name as string).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleSearch = () => {
    setSearch(searchInput);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
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
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v === "all" || v === null ? "" : v)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
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
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead className="hidden md:table-cell">Cost</TableHead>
                <TableHead className="hidden md:table-cell">Margin</TableHead>
                <TableHead className="hidden lg:table-cell">Prep Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : !filtered.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {search || category
                      ? "No products match your filters."
                      : "No products yet. Add your first product to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => {
                  const basePrice = parseFloat(product.base_price as string);
                  const cost = product.cost_per_unit
                    ? parseFloat(product.cost_per_unit as string)
                    : null;
                  const margin =
                    cost !== null && basePrice > 0
                      ? ((basePrice - cost) / basePrice) * 100
                      : null;

                  return (
                    <TableRow key={product.id as string} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {product.name as string}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {product.category ? (
                          <Badge variant="secondary" className="capitalize">
                            {product.category as string}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(basePrice)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {cost !== null ? formatCurrency(cost) : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {margin !== null ? (
                          <span
                            className={
                              margin > 60
                                ? "text-green-600 font-medium"
                                : margin >= 40
                                ? "text-yellow-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {margin.toFixed(1)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {product.prep_time_minutes
                          ? `${product.prep_time_minutes} min`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? "default" : "secondary"}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
