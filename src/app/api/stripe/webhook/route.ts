import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type OrderPaymentState = {
  status: string;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.warn("No orderId found in session metadata for checkout.session.completed event");
          break;
        }

        const { data: currentOrder, error: orderFetchError } = await supabaseAdmin
          .from("orders")
          .select("status, paid_at, stripe_checkout_session_id")
          .eq("id", orderId)
          .single<OrderPaymentState>();

        if (orderFetchError || !currentOrder) {
          console.error(`Failed to fetch order ${orderId} during checkout completion:`, orderFetchError);
          break;
        }

        if (currentOrder.paid_at) {
          break;
        }

        const updates: { paid_at: string; status?: string; stripe_checkout_session_id?: string } = {
          paid_at: new Date().toISOString(),
        };

        if (currentOrder.status === "pending") {
          updates.status = "confirmed";
        }

        if (session.id !== currentOrder.stripe_checkout_session_id) {
          updates.stripe_checkout_session_id = session.id;
        }

        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update(updates)
          .eq("id", orderId)
          .is("paid_at", null);

        if (updateError) {
          console.error(`Failed to update order ${orderId} on payment success:`, updateError);
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId ?? "unknown";
        console.error(
          `Payment failed for order ${orderId}: ${paymentIntent.last_payment_error?.message ?? "Unknown error"}`
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
