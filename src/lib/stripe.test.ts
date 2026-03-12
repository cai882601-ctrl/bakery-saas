import { expect, test, describe } from "vitest";

// Set before importing stripe module (module-level env check)
process.env.STRIPE_SECRET_KEY ??= "sk_test_placeholder";

const { formatStripeLineItems } = await import("./stripe");

describe("formatStripeLineItems", () => {
  test("should format order items correctly", () => {
    const order = {
      tax: "5.00",
      delivery_fee: "10.00",
      order_items: [
        {
          product_name: "Chocolate Cake",
          unit_price: "45.00",
          quantity: 1,
          customizations: "Happy Birthday",
        },
      ],
    };

    const lineItems = formatStripeLineItems(order);

    expect(lineItems).toHaveLength(3); // Cake, Tax, Delivery Fee
    expect(lineItems[0].price_data?.product_data?.name).toBe("Chocolate Cake");
    expect(lineItems[0].price_data?.unit_amount).toBe(4500);
    expect(lineItems[0].price_data?.product_data?.description).toBe("Happy Birthday");
    expect(lineItems[1].price_data?.product_data?.name).toBe("Tax");
    expect(lineItems[1].price_data?.unit_amount).toBe(500);
    expect(lineItems[2].price_data?.product_data?.name).toBe("Delivery Fee");
    expect(lineItems[2].price_data?.unit_amount).toBe(1000);
  });

  test("should handle zero tax and delivery fee", () => {
    const order = {
      tax: "0.00",
      delivery_fee: 0,
      order_items: [
        {
          product_name: "Cookies",
          unit_price: 2.5,
          quantity: 12,
        },
      ],
    };

    const lineItems = formatStripeLineItems(order);

    expect(lineItems).toHaveLength(1);
    expect(lineItems[0].price_data?.unit_amount).toBe(250);
    expect(lineItems[0].quantity).toBe(12);
  });
});
