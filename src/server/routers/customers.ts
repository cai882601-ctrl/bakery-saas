import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { supabaseAdmin } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";
import { DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/default-user";

export const customersRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        source: z.string().optional(),
        sortBy: z.enum(["name", "total_orders", "total_spent", "created_at"]).default("name"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
        limit: z.number().min(1).max(100).default(20),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from("customers")
        .select("*", { count: "exact" });

      if (input.search) {
        query = query.or(
          `name.ilike.%${input.search}%,email.ilike.%${input.search}%,phone.ilike.%${input.search}%`
        );
      }

      if (input.source) {
        query = query.eq("source", input.source);
      }

      query = query
        .order(input.sortBy, { ascending: input.sortOrder === "asc" })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      const { data, error, count } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return {
        customers: data ?? [],
        total: count ?? 0,
        page: input.page,
        totalPages: Math.ceil((count ?? 0) / input.limit),
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      return data;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        source: z.string().default("direct"),
      })
    )
    .mutation(async ({ input }) => {
      await ensureDefaultUser();

      const { data, error } = await supabaseAdmin
        .from("customers")
        .insert({ ...input, user_id: DEFAULT_USER_ID })
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabaseAdmin
        .from("customers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  getStats: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("id, total, created_at")
        .eq("customer_id", input.id);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const orders = data ?? [];
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total as string), 0);
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = totalOrders > 0
        ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;

      return {
        totalOrders,
        totalSpent,
        avgOrderValue,
        lastOrderDate: lastOrderDate as string | null,
      };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin.from("customers").delete().eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
