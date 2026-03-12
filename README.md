This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Stripe Integration

BakeBoard includes Stripe payment infrastructure for accepting payments on orders.

### Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register) and get your API keys.
2. Copy the keys into your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. For local webhook testing, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will print a webhook signing secret (`whsec_...`) — use that as `STRIPE_WEBHOOK_SECRET`.

### How It Works

- **Checkout**: The "Pay with Stripe" button on an order detail page calls `POST /api/stripe/checkout`, which creates a Stripe Checkout Session with the order's line items and redirects the customer to Stripe's hosted payment page.
- **Webhooks**: `POST /api/stripe/webhook` receives Stripe events. On `checkout.session.completed`, the order's `paid_at` timestamp is set.
- **Schema**: Orders store a `stripe_checkout_session_id` for linking back to Stripe.

### Supported Events

| Event | Action |
|---|---|
| `checkout.session.completed` | Marks order as paid |
| `payment_intent.succeeded` | Logged (extend as needed) |
| `payment_intent.payment_failed` | Logged for debugging |

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
