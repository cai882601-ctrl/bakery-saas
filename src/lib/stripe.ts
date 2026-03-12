import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export function formatStripeLineItems(order: {
  tax: string | number | null;
  delivery_fee: string | number | null;
  order_items: Array<{
    product_name: string;
    unit_price: string | number;
    quantity: number;
    customizations?: string | null;
  }>;
}) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = (order.order_items || []).map(
    (item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product_name,
          ...(item.customizations ? { description: item.customizations } : {}),
        },
        unit_amount: Math.round(Number(item.unit_price) * 100),
      },
      quantity: item.quantity,
    })
  );

  const tax = Number(order.tax || 0);
  if (tax > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Tax" },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });
  }

  const deliveryFee = Number(order.delivery_fee || 0);
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Fee" },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  return lineItems;
}
