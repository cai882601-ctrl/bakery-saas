import Link from "next/link";
import { ChefHat } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <ChefHat className="size-4 text-primary" />
          BakeBoard
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#testimonials" className="hover:text-foreground">
            Testimonials
          </Link>
          <Link href="/auth/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} BakeBoard. All rights reserved.</p>
      </div>
    </footer>
  );
}
