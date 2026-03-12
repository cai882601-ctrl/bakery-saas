import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/default-user";

export const calendarRouter = createTRPCRouter({
  getSlots: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("calendar_slots")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID)
        .gte("date", input.startDate)
        .lte("date", input.endDate)
        .order("date", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { slots: data ?? [] };
    }),

  getSlotByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("calendar_slots")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("date", input.date)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { slot: data };
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
      await ensureDefaultUser();

      const { data: existing } = await supabaseAdmin
        .from("calendar_slots")
        .select("id")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("date", input.date)
        .maybeSingle();

      const payload = {
        user_id: DEFAULT_USER_ID,
        date: input.date,
        max_orders: input.maxOrders,
        is_blocked: input.isBlocked,
        block_reason: input.blockReason ?? null,
        notes: input.notes ?? null,
      };

      let result;
      if (existing) {
        result = await supabaseAdmin
          .from("calendar_slots")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
      } else {
        result = await supabaseAdmin
          .from("calendar_slots")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }

      return { slot: result.data };
    }),

  blockDate: publicProcedure
    .input(
      z.object({
        date: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await ensureDefaultUser();

      const { data: existing } = await supabaseAdmin
        .from("calendar_slots")
        .select("id")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("date", input.date)
        .maybeSingle();

      let result;
      if (existing) {
        result = await supabaseAdmin
          .from("calendar_slots")
          .update({
            is_blocked: true,
            block_reason: input.reason ?? null,
          })
          .eq("id", existing.id)
          .select()
          .single();
      } else {
        result = await supabaseAdmin
          .from("calendar_slots")
          .insert({
            user_id: DEFAULT_USER_ID,
            date: input.date,
            is_blocked: true,
            block_reason: input.reason ?? null,
          })
          .select()
          .single();
      }

      if (result.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }

      return { slot: result.data };
    }),

  unblockDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .mutation(async ({ input }) => {
      const { data: existing } = await supabaseAdmin
        .from("calendar_slots")
        .select("id")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("date", input.date)
        .maybeSingle();

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No slot found for this date",
        });
      }

      const { data, error } = await supabaseAdmin
        .from("calendar_slots")
        .update({
          is_blocked: false,
          block_reason: null,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { slot: data };
    }),
});
