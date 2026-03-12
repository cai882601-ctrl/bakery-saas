import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = (await req.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Fetch order from database
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paid_at) {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    // Build line items from order items
    const lineItems = (order.order_items as Array<Record<string, unknown>>).map(
      (item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product_name as string,
            ...(item.customizations
              ? { description: item.customizations as string }
              : {}),
          },
          unit_amount: Math.round(parseFloat(item.unit_price as string) * 100),
        },
        quantity: item.quantity as number,
      })
    );

    // Add tax as a line item if present
    if (parseFloat(order.tax as string) > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Tax" },
          unit_amount: Math.round(parseFloat(order.tax as string) * 100),
        },
        quantity: 1,
      });
    }

    // Add delivery fee as a line item if present
    if (parseFloat(order.delivery_fee as string) > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Delivery Fee" },
          unit_amount: Math.round(parseFloat(order.delivery_fee as string) * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.nextUrl.origin}/orders/${orderId}?payment=success`,
      cancel_url: `${req.nextUrl.origin}/orders/${orderId}?payment=cancelled`,
      metadata: {
        orderId,
        orderNumber: order.order_number as string,
      },
    });

    // Save checkout session ID to order
    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", orderId);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
