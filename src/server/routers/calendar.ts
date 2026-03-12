import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const calendarRouter = createTRPCRouter({
  getSlots: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      return { slots: [] };
    }),

  upsertSlot: publicProcedure
    .input(
      z.object({
        date: z.string(),
        maxOrders: z.number().int().positive().default(5),
        isBlocked: z.boolean().default(false),
        blockReason: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  blockDate: publicProcedure
    .input(
      z.object({
        date: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  unblockDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});
