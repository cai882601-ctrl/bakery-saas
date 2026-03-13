import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { supabaseAdmin } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";
import { DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/default-user";

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export const ordersRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        customerId: z.string().uuid().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["created_at", "total", "delivery_date"]).default("created_at"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().min(1).max(100).default(20),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from("orders")
        .select("*, customers(name, email, phone), order_items(*, products(name))", { count: "exact" });

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.customerId) {
        query = query.eq("customer_id", input.customerId);
      }

      if (input.search) {
        query = query.or(
          `order_number.ilike.%${input.search}%,customers.name.ilike.%${input.search}%`
        );
      }

      query = query
        .order(input.sortBy, { ascending: input.sortOrder === "asc" })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      const { data, error, count } = await query;

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      return {
        orders: data ?? [],
        total: count ?? 0,
        page: input.page,
        totalPages: Math.ceil((count ?? 0) / input.limit),
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*, customers(id, name, email, phone, address), order_items(*, products(name, base_price))")
        .eq("id", input.id)
        .single();

      if (error) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      return data;
    }),

  create: publicProcedure
    .input(
      z.object({
        customerId: z.string().uuid().optional().nullable(),
        items: z.array(
          z.object({
            productId: z.string().uuid().optional().nullable(),
            productName: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().positive(),
          })
        ).min(1),
        deliveryDate: z.string().optional().nullable(),
        deliveryTime: z.string().optional().nullable(),
        deliveryMethod: z.enum(["pickup", "delivery"]).default("pickup"),
        notes: z.string().optional().nullable(),
        source: z.string().default("direct"),
      })
    )
    .mutation(async ({ input }) => {
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const total = subtotal; // No tax/delivery fee for now

      // TODO: Replace with real user id from auth
      await ensureDefaultUser();

      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: DEFAULT_USER_ID,
          customer_id: input.customerId || null,
          order_number: generateOrderNumber(),
          status: "pending",
          source: input.source,
          subtotal: subtotal.toFixed(2),
          tax: "0",
          delivery_fee: "0",
          total: total.toFixed(2),
          notes: input.notes || null,
          delivery_date: input.deliveryDate || null,
          delivery_time: input.deliveryTime || null,
          delivery_method: input.deliveryMethod,
        })
        .select()
        .single();

      if (orderError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: orderError.message });

      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice.toFixed(2),
        total_price: (item.quantity * item.unitPrice).toFixed(2),
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: itemsError.message });

      return order;
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "in_progress", "ready", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: Record<string, string> = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };
      if (input.status === "delivered") {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from("orders")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        customerId: z.string().uuid().optional().nullable(),
        deliveryDate: z.string().optional().nullable(),
        deliveryTime: z.string().optional().nullable(),
        deliveryMethod: z.enum(["pickup", "delivery"]).optional(),
        notes: z.string().optional().nullable(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId;
      if (updates.deliveryDate !== undefined) dbUpdates.delivery_date = updates.deliveryDate;
      if (updates.deliveryTime !== undefined) dbUpdates.delivery_time = updates.deliveryTime;
      if (updates.deliveryMethod !== undefined) dbUpdates.delivery_method = updates.deliveryMethod;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.source !== undefined) dbUpdates.source = updates.source;

      const { data, error } = await supabaseAdmin
        .from("orders")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  getDeliveryDates: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("delivery_date")
        .gte("delivery_date", input.startDate)
        .lte("delivery_date", input.endDate)
        .not("delivery_date", "is", null)
        .neq("status", "cancelled");

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const dates = [...new Set((data ?? []).map((o) => o.delivery_date as string))];
      return { dates };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin.from("orders").delete().eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
