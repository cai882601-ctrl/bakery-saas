"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export function Header() {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const open = openPathname === pathname;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => setOpenPathname(nextOpen ? pathname : null)}
      >
        <SheetTrigger>
          <Button variant="ghost" size="icon-lg" className="lg:hidden min-h-[44px] min-w-[44px]" render={<span />}>
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar className="pt-6" />
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h2 className="text-lg font-semibold lg:hidden">🧁 BakeBoard</h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium" aria-hidden="true">
          B
        </div>
      </div>
    </header>
  );
}
