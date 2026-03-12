import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  Calculator,
  CalendarDays,
  ShoppingBag,
  Smartphone,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "BakeBoard — Cottage Bakery Order Management Software",
  description:
    "The all-in-one platform for cottage bakers. Manage orders, customers, recipe costing, and production scheduling in one simple app.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BakeBoard — Cottage Bakery Order Management Software",
    description:
      "The all-in-one platform for cottage bakers. Manage orders, customers, recipe costing, and production scheduling.",
    type: "website",
    siteName: "BakeBoard",
    url: "/",
  },
};

const features = [
  {
    icon: ClipboardList,
    title: "Order Management",
    description:
      "Track orders from inquiry to delivery. Manage statuses, due dates, and custom order details in one place.",
  },
  {
    icon: Users,
    title: "Customer CRM",
    description:
      "Build lasting relationships. Store customer preferences, order history, and contact details effortlessly.",
  },
  {
    icon: Calculator,
    title: "Recipe Costing",
    description:
      "Know your true margins. Calculate ingredient costs per recipe and set profitable pricing with confidence.",
  },
  {
    icon: CalendarDays,
    title: "Production Calendar",
    description:
      "Plan your baking schedule. See upcoming orders, set availability, and never miss a pickup deadline.",
  },
  {
    icon: ShoppingBag,
    title: "Multi-channel Orders",
    description:
      "Accept orders from any source. Manage in-person, social media, and website orders in a single dashboard.",
  },
  {
    icon: Smartphone,
    title: "Mobile Ready PWA",
    description:
      "Run your bakery from anywhere. Full mobile support so you can manage orders on the go, even offline.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Home Baker, Portland",
    quote:
      "BakeBoard transformed how I run my cottage bakery. I went from sticky notes and spreadsheets to a real system overnight.",
    rating: 5,
  },
  {
    name: "James K.",
    role: "Cottage Baker, Austin",
    quote:
      "The recipe costing feature alone saved me hundreds. I finally know my real margins on every item I sell.",
    rating: 5,
  },
  {
    name: "Emily R.",
    role: "Custom Cake Baker, Seattle",
    quote:
      "My customers love the professional experience. Scheduling and order tracking keep my kitchen running smoothly.",
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 opacity-50 blur-[100px]"></div>
          
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1 text-sm font-medium">
                Built specifically for cottage bakers
              </Badge>
              <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Manage your cottage bakery{" "}
                <span className="text-primary">with ease</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:text-2xl">
                The all-in-one platform to track orders, manage customers, calculate recipe costs, and schedule your baking — so you can focus on what you love.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="xl" className="w-full sm:w-auto" render={<Link href="/dashboard" />}>
                  Start free today
                  <ArrowRight data-icon="inline-end" className="size-5" />
                </Button>
                <Button variant="outline" size="xl" className="w-full sm:w-auto" render={<Link href="/pricing" />}>
                  View pricing
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" />
                  Free for 10 orders/mo
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" />
                  No credit card required
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Prop / Social Proof Banner */}
        <section className="border-y bg-muted/30 py-12">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Trusted by 500+ home bakers across the country
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <h2 className="text-base font-semibold text-primary uppercase tracking-wide">Features</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Everything you need, none of the fluff
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                We built BakeBoard specifically for the unique needs of cottage food businesses.
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-none bg-background shadow-none transition-all hover:translate-y-[-4px]">
                  <CardContent className="p-6">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                      <feature.icon className="size-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-muted/30 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                What our bakers are saying
              </h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="flex flex-col justify-between">
                  <CardContent className="p-8">
                    <div className="mb-4 flex gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="size-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <blockquote className="text-lg italic leading-relaxed text-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <div className="mt-8 flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 lg:py-32 overflow-hidden relative">
           <div className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 opacity-50 blur-[120px]"></div>
          
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to take your bakery to the next level?
            </h2>
            <p className="mt-6 text-xl text-muted-foreground">
              Join hundreds of cottage bakers who are saving time and growing their business with BakeBoard.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" className="px-12" render={<Link href="/dashboard" />}>
                Get started for free
              </Button>
              <Link href="/pricing" className="text-sm font-semibold hover:text-primary transition-colors">
                Compare all plans
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
