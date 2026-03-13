"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import {
  Package,
  Users,
  ShoppingCart,
  ArrowRight,
  Plus,
  AlertCircle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const ordersQuery = trpc.orders.list.useQuery({
    status: "pending",
    limit: 5,
  });
  const customersQuery = trpc.customers.list.useQuery({ limit: 1 });
  const productsQuery = trpc.products.list.useQuery({
    activeOnly: true,
    limit: 1,
  });
  const weekOrdersQuery = trpc.orders.list.useQuery({ limit: 100 });
  const recentOrdersQuery = trpc.orders.list.useQuery({ limit: 5 });

  const isLoading =
    ordersQuery.isLoading ||
    customersQuery.isLoading ||
    productsQuery.isLoading ||
    weekOrdersQuery.isLoading ||
    recentOrdersQuery.isLoading;

  const isError =
    ordersQuery.isError ||
    customersQuery.isError ||
    productsQuery.isError ||
    weekOrdersQuery.isError ||
    recentOrdersQuery.isError;

  const pendingOrders = ordersQuery.data?.total ?? 0;
  const totalCustomers = customersQuery.data?.total ?? 0;
  const activeProducts = productsQuery.data?.total ?? 0;

  const weekRevenue = (() => {
    if (!weekOrdersQuery.data?.orders) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return (weekOrdersQuery.data.orders as Array<Record<string, unknown>>)
      .filter((o) => new Date(o.created_at as string) >= startOfWeek)
      .reduce((sum, o) => sum + parseFloat((o.total as string) ?? "0"), 0);
  })();

  const allZero =
    pendingOrders === 0 &&
    totalCustomers === 0 &&
    activeProducts === 0 &&
    weekRevenue === 0;

  function handleRetry() {
    ordersQuery.refetch();
    customersQuery.refetch();
    productsQuery.refetch();
    weekOrdersQuery.refetch();
    recentOrdersQuery.refetch();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            BakeBoard cottage bakery command center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {isError ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="text-center">
              <p className="font-medium">Failed to load dashboard data</p>
              <p className="text-sm text-muted-foreground">
                Something went wrong. Please try again.
              </p>
            </div>
            <Button variant="outline" onClick={handleRetry}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Pending Orders"
              value={pendingOrders}
              icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
              badge="Active"
            />
            <StatCard
              title="Total Customers"
              value={totalCustomers}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />
            <StatCard
              title="Active Products"
              value={activeProducts}
              icon={<Package className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
            />
            <StatCard
              title="This Week Revenue"
              value={formatCurrency(weekRevenue)}
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              isLoading={isLoading}
              badge="7 Days"
            />
          </div>

          {!isLoading && allZero ? (
            <Card className="border-dashed bg-muted/20">
              <CardHeader>
                <CardTitle className="text-xl">Welcome to BakeBoard!</CardTitle>
                <CardDescription>
                  Follow these steps to set up your bakery command center.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <SetupStep
                    href="/products/new"
                    icon={<Package className="h-5 w-5" />}
                    title="Add Products"
                    description="Create your bakery items and pricing."
                  />
                  <SetupStep
                    href="/customers"
                    icon={<Users className="h-5 w-5" />}
                    title="Add Customers"
                    description="Save details for quick order entry."
                  />
                  <SetupStep
                    href="/orders/new"
                    icon={<ShoppingCart className="h-5 w-5" />}
                    title="Create Order"
                    description="Start tracking your sales today."
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>
                      The latest orders placed in your bakery.
                    </CardDescription>
                  </div>
                  <Link href="/orders">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      View All
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                          >
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                          </div>
                        ))
                    ) : recentOrdersQuery.data?.orders?.length ? (
                      (recentOrdersQuery.data.orders as any[]).map((order) => (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-medium">
                                {order.customers?.name || "Guest Customer"}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                • {order.order_number}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {order.delivery_date
                                  ? format(new Date(order.delivery_date), "MMM d")
                                  : "No date"}
                              </span>
                              <span>•</span>
                              <span>{formatCurrency(parseFloat(order.total))}</span>
                            </div>
                          </div>
                          <StatusBadge status={order.status} />
                        </Link>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ShoppingCart className="mb-2 h-10 w-10 text-muted-foreground/20" />
                        <p className="text-sm text-muted-foreground">
                          No orders yet
                        </p>
                      </div>
                    )}
                  </div>
                  <Link href="/orders" className="mt-4 block sm:hidden">
                    <Button variant="outline" className="w-full">
                      View All Orders
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Commonly used tasks.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <QuickAction
                    href="/orders/new"
                    icon={<Plus className="h-4 w-4" />}
                    title="New Order"
                  />
                  <QuickAction
                    href="/calendar"
                    icon={<Calendar className="h-4 w-4" />}
                    title="View Calendar"
                  />
                  <QuickAction
                    href="/products"
                    icon={<Package className="h-4 w-4" />}
                    title="Manage Products"
                  />
                  <QuickAction
                    href="/customers"
                    icon={<Users className="h-4 w-4" />}
                    title="Customer List"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  isLoading,
  badge,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  badge?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {badge ? (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {badge}
          </Badge>
        ) : (
          icon
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}

function SetupStep({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-3 rounded-xl border bg-background p-6 text-center transition-all hover:border-primary hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="w-full justify-start gap-3 px-4 py-6 text-left hover:bg-muted"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-background">
          {icon}
        </div>
        <span className="font-medium">{title}</span>
        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
      </Button>
    </Link>
  );
}
