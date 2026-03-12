import Stripe from "stripe";

type MoneyInput = string | number | null;

export type StripeOrderItemInput = {
  product_name: string;
  unit_price: string | number;
  quantity: number;
  customizations?: string | null;
};

export type StripeOrderLineItemsInput = {
  tax: MoneyInput;
  delivery_fee: MoneyInput;
  order_items: StripeOrderItemInput[];
};

let stripeClient: Stripe | null = null;

function requireEnv(name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set in environment variables`);
  }

  return value;
}

export function getStripe(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

function toUnitAmount(value: MoneyInput, label: string): number {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Invalid ${label} amount`);
  }

  return Math.round(amount * 100);
}

export function formatStripeLineItems(order: StripeOrderLineItemsInput) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.order_items.map(
    (item) => {
      const quantity = Math.trunc(item.quantity);

      if (!item.product_name.trim()) {
        throw new Error("Order item name is required");
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for ${item.product_name}`);
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product_name,
            ...(item.customizations ? { description: item.customizations } : {}),
          },
          unit_amount: toUnitAmount(item.unit_price, `${item.product_name} unit price`),
        },
        quantity,
      };
    }
  );

  const tax = toUnitAmount(order.tax, "tax");
  if (tax > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Tax" },
        unit_amount: tax,
      },
      quantity: 1,
    });
  }

  const deliveryFee = toUnitAmount(order.delivery_fee, "delivery fee");
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Fee" },
        unit_amount: deliveryFee,
      },
      quantity: 1,
    });
  }

  return lineItems;
}
