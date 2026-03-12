import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const ordersRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // TODO: Replace with Supabase query
      return { orders: [], nextCursor: undefined };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return null;
    }),

  create: publicProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional(),
        items: z.array(
          z.object({
            productId: z.string().uuid().optional(),
            productName: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().positive(),
          })
        ),
        deliveryDate: z.string().optional(),
        deliveryTime: z.string().optional(),
        deliveryMethod: z.enum(["pickup", "delivery"]).default("pickup"),
        notes: z.string().optional(),
        source: z.string().default("direct"),
      })
    )
    .mutation(async ({ input }) => {
      return { id: "placeholder", orderNumber: "ORD-001" };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum([
          "pending",
          "confirmed",
          "in_progress",
          "ready",
          "delivered",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});
