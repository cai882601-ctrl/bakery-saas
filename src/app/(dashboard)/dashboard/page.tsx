"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { Package, Users, ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: ordersData } = trpc.orders.list.useQuery({
    status: "pending",
    limit: 1,
  });
  const { data: customersData } = trpc.customers.list.useQuery({ limit: 1 });
  const { data: productsData } = trpc.products.list.useQuery({
    activeOnly: true,
    limit: 1,
  });
  const { data: weekOrdersData } = trpc.orders.list.useQuery({ limit: 100 });

  const pendingOrders = ordersData?.total ?? 0;
  const totalCustomers = customersData?.total ?? 0;
  const activeProducts = productsData?.products?.length ?? 0;

  const weekRevenue = (() => {
    if (!weekOrdersData?.orders) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return (weekOrdersData.orders as Array<Record<string, unknown>>)
      .filter((o) => new Date(o.created_at as string) >= startOfWeek)
      .reduce((sum, o) => sum + parseFloat((o.total as string) ?? "0"), 0);
  })();

  const allZero =
    pendingOrders === 0 &&
    totalCustomers === 0 &&
    activeProducts === 0 &&
    weekRevenue === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to BakeBoard — your cottage bakery command center.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Badge variant="secondary">Today</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weekRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {allZero && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Set up your bakery in three steps:
            </p>
            <div className="space-y-3">
              <Link
                href="/products/new"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Add your first product</p>
                    <p className="text-xs text-muted-foreground">
                      Create a product with pricing and prep time
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/customers"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Add a customer</p>
                    <p className="text-xs text-muted-foreground">
                      Save customer details for easy order entry
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/orders/new"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Create your first order</p>
                    <p className="text-xs text-muted-foreground">
                      Start tracking orders and revenue
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
