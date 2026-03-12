import Link from "next/link";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ChefHat className="size-5 text-primary" />
          BakeBoard
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/#testimonials"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonials
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
            Sign in
          </Button>
          <Button size="sm" render={<Link href="/dashboard" />}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
