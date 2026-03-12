"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Users,
  CakeSlice,
  CalendarDays,
  Settings,
  LayoutDashboard,
  Wheat,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: CakeSlice },
  { href: "/ingredients", label: "Ingredients", icon: Wheat },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 p-4", className)}>
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold tracking-tight">🧁 BakeBoard</h1>
        <p className="text-xs text-muted-foreground">Order Management</p>
      </div>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
