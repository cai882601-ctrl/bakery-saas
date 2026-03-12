import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set in environment variables");
}
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        console.log(`Payment succeeded for order ${orderId}, updating status...`);
        
        // Update paid_at and conditionally update status
        // We only move to 'confirmed' if it's currently 'pending'
        const { data: currentOrder } = await supabaseAdmin
          .from("orders")
          .select("status, paid_at")
          .eq("id", orderId)
          .single();

        if (currentOrder && !currentOrder.paid_at) {
          const updates: { paid_at: string; status?: string } = {
            paid_at: new Date().toISOString(),
          };
          if (currentOrder.status === "pending") {
            updates.status = "confirmed";
          }

          const { error } = await supabaseAdmin
            .from("orders")
            .update(updates)
            .eq("id", orderId);

          if (error) {
            console.error(`Failed to update order ${orderId} on payment success:`, error);
          } else {
            console.log(`Successfully updated order ${orderId} to paid${updates.status ? " and confirmed" : ""}.`);
          }
        }
      } else {
        console.warn("No orderId found in session metadata for checkout.session.completed event");
      }
      break;
    }

    case "payment_intent.succeeded": {
      console.log(`Payment intent succeeded: ${event.data.object.id}`);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      console.error(`Payment failed for order ${orderId}: ${paymentIntent.last_payment_error?.message}`);
      
      if (orderId) {
        // Log the failure to the database or notify (optional for now)
        console.log(`Log failure for order ${orderId}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
