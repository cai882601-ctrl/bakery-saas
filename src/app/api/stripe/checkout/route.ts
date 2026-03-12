import { NextRequest, NextResponse } from "next/server";
import { stripe, formatStripeLineItems } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = (await req.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Fetch order from database with related data
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*), customers(name, email, phone)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Order fetch error:", error);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paid_at) {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    const order_items = (order.order_items || []) as Array<{
      product_name: string;
      unit_price: string | number;
      quantity: number;
      customizations?: string | null;
    }>;

    // Build line items from order items
    const lineItems = formatStripeLineItems({
      tax: order.tax,
      delivery_fee: order.delivery_fee,
      order_items,
    });

    if (lineItems.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }

    const customer = order.customers as { name: string; email?: string } | null;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customer?.email || undefined,
      success_url: `${req.nextUrl.origin}/orders/${orderId}?payment=success`,
      cancel_url: `${req.nextUrl.origin}/orders/${orderId}?payment=cancelled`,
      metadata: {
        orderId,
        orderNumber: order.order_number,
        customerName: customer?.name ?? "Walk-in Customer",
      },
    });

    // Save checkout session ID to order
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to save checkout session ID:", updateError);
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
