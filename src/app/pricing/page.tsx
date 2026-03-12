import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Pricing — BakeBoard",
  description:
    "Simple, transparent pricing for cottage bakers. Start free with up to 10 orders per month. Upgrade to Pro or Business as your bakery grows.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing — BakeBoard",
    description:
      "Simple, transparent pricing for cottage bakers. Start free, upgrade as you grow.",
    type: "website",
    siteName: "BakeBoard",
    url: "/pricing",
  },
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Ideal for hobbyists and new cottage bakers.",
    features: [
      "Up to 10 orders per month",
      "Basic customer CRM",
      "Order status tracking",
      "Monthly calendar view",
      "Mobile PWA access",
    ],
    cta: "Start for free",
    variant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious bakers growing their business.",
    features: [
      "Unlimited orders",
      "Everything in Free",
      "Full recipe costing",
      "Ingredient inventory",
      "Product catalog",
      "Production reports",
      "Priority email support",
    ],
    cta: "Start 14-day free trial",
    variant: "default" as const,
    highlighted: true,
  },
  {
    name: "Business",
    price: "$79",
    period: "/month",
    description: "For established teams and high-volume kitchens.",
    features: [
      "Everything in Pro",
      "Up to 3 team members",
      "Advanced sales analytics",
      "Custom order fields",
      "API access (Beta)",
      "Priority phone support",
    ],
    cta: "Contact sales",
    variant: "outline" as const,
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:py-32">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Focus on baking, not on subscription math. Choose the plan that fits your current volume and scale as you grow.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:pb-32">
          <div className="grid gap-8 lg:grid-cols-3">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlighted
                    ? "relative border-primary shadow-xl ring-1 ring-primary scale-105 z-10"
                    : "flex flex-col border-border/50"
                }
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      Most popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-8 text-center">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="min-h-[40px] mt-2">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-8 text-center">
                    <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                    <span className="text-muted-foreground ml-1">
                      {tier.period}
                    </span>
                  </div>
                  <ul className="space-y-4">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-tight"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pb-8">
                  <Button
                    variant={tier.variant}
                    size="lg"
                    className="w-full font-bold"
                    render={<Link href="/dashboard" />}
                  >
                    {tier.cta}
                    {tier.highlighted && <ArrowRight data-icon="inline-end" className="size-4" />}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="border-t bg-muted/30 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Common questions
              </h2>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <HelpCircle className="size-5 text-primary" />
                  Can I change plans later?
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <HelpCircle className="size-5 text-primary" />
                  Is there a free trial for Pro?
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Absolutely. Every new account starts with a 14-day free trial of our Pro features. No credit card required.
                </p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <HelpCircle className="size-5 text-primary" />
                  What happens if I exceed 10 orders on Free?
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  You&apos;ll still be able to manage existing orders, but you won&apos;t be able to create new ones until the next month or you upgrade to Pro.
                </p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <HelpCircle className="size-5 text-primary" />
                  Do you take a cut of my sales?
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  No. We charge a flat subscription fee. Your revenue is yours to keep (minus whatever payment processor you use).
                </p>
              </div>
            </div>
            
            <div className="mt-20 rounded-3xl bg-primary/5 p-8 text-center sm:p-12">
              <h3 className="text-2xl font-bold">Still have questions?</h3>
              <p className="mt-4 text-muted-foreground">
                We&apos;re here to help you grow your bakery.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button variant="outline" render={<Link href="mailto:support@bakeboard.app" />}>
                  Email Support
                </Button>
                <Button render={<Link href="/dashboard" />}>
                  Start your free trial
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
