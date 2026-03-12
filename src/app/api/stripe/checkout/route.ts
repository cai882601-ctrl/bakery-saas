import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { formatStripeLineItems, getStripe, type StripeOrderItemInput } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const checkoutBodySchema = z.object({
  orderId: z.string().uuid(),
});

type CheckoutOrderRecord = {
  id: string;
  order_number: string;
  tax: string | number | null;
  delivery_fee: string | number | null;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  order_items: StripeOrderItemInput[] | null;
  customers: {
    name: string | null;
    email: string | null;
  } | null;
};

export async function POST(req: NextRequest) {
  try {
    const parsedBody = checkoutBodySchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "A valid orderId is required" }, { status: 400 });
    }

    const { orderId } = parsedBody.data;
    const stripe = getStripe();

    // Fetch order from database with related data
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*), customers(name, email, phone)")
      .eq("id", orderId)
      .single<CheckoutOrderRecord>();

    if (error || !order) {
      console.error("Order fetch error:", error);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paid_at) {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    // Build line items from order items
    const lineItems = formatStripeLineItems({
      tax: order.tax,
      delivery_fee: order.delivery_fee,
      order_items: order.order_items ?? [],
    });

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }

    if (order.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);

        if (existingSession.status === "open" && existingSession.url) {
          return NextResponse.json({ url: existingSession.url });
        }
      } catch (sessionError) {
        console.warn("Failed to retrieve existing checkout session:", sessionError);
      }
    }

    const customer = order.customers;
    const siteUrl = getSiteUrl().origin;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customer?.email || undefined,
      success_url: `${siteUrl}/orders/${orderId}?payment=success`,
      cancel_url: `${siteUrl}/orders/${orderId}?payment=cancelled`,
      client_reference_id: orderId,
      metadata: {
        orderId,
        orderNumber: order.order_number,
        customerName: customer?.name ?? "Walk-in Customer",
      },
      payment_intent_data: {
        metadata: {
          orderId,
          orderNumber: order.order_number,
        },
      },
    });

    if (!session.url) {
      console.error("Stripe checkout session missing URL:", session.id);
      return NextResponse.json(
        { error: "Stripe checkout session could not be created" },
        { status: 502 }
      );
    }

    // Save checkout session ID to order
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to save checkout session ID:", updateError);
      return NextResponse.json(
        { error: "Failed to persist checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
