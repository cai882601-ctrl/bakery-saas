import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { supabaseAdmin } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";
import { DEFAULT_USER_ID, ensureDefaultUser } from "@/lib/default-user";

export const ingredientsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        sortBy: z.enum(["name", "cost_per_unit", "created_at"]).default("name"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
        limit: z.number().min(1).max(100).default(50),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from("ingredients")
        .select("*", { count: "exact" });

      if (input.search) {
        // Escape special PostgREST filter characters to prevent filter injection
        const escaped = input.search.replace(/[%_\\(),."']/g, (ch) => `\\${ch}`);
        query = query.or(
          `name.ilike.%${escaped}%,supplier.ilike.%${escaped}%`
        );
      }

      query = query
        .order(input.sortBy, { ascending: input.sortOrder === "asc" })
        .range(
          (input.page - 1) * input.limit,
          input.page * input.limit - 1
        );

      const { data, error, count } = await query;
      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });

      return {
        ingredients: data ?? [],
        total: count ?? 0,
        page: input.page,
        totalPages: Math.ceil((count ?? 0) / input.limit),
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("ingredients")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error)
        throw new TRPCError({ code: "NOT_FOUND", message: "Ingredient not found" });
      return data;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        unit: z.string().min(1),
        costPerUnit: z.number().nonnegative(),
        supplier: z.string().optional().nullable(),
        inStock: z.number().nonnegative().default(0),
        lowStockThreshold: z.number().nonnegative().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      await ensureDefaultUser();

      const { data, error } = await supabaseAdmin
        .from("ingredients")
        .insert({
          user_id: DEFAULT_USER_ID,
          name: input.name,
          unit: input.unit,
          cost_per_unit: input.costPerUnit.toFixed(4),
          supplier: input.supplier || null,
          in_stock: input.inStock.toFixed(2),
          low_stock_threshold: input.lowStockThreshold?.toFixed(2) ?? null,
        })
        .select()
        .single();

      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      return data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        unit: z.string().min(1).optional(),
        costPerUnit: z.number().nonnegative().optional(),
        supplier: z.string().optional().nullable(),
        inStock: z.number().nonnegative().optional(),
        lowStockThreshold: z.number().nonnegative().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, costPerUnit, inStock, lowStockThreshold, ...rest } = input;
      const updates: Record<string, unknown> = {
        ...rest,
        updated_at: new Date().toISOString(),
      };
      if (costPerUnit !== undefined)
        updates.cost_per_unit = costPerUnit.toFixed(4);
      if (inStock !== undefined) updates.in_stock = inStock.toFixed(2);
      if (lowStockThreshold !== undefined)
        updates.low_stock_threshold =
          lowStockThreshold !== null ? lowStockThreshold.toFixed(2) : null;

      const { data, error } = await supabaseAdmin
        .from("ingredients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from("ingredients")
        .delete()
        .eq("id", input.id);
      if (error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      return { success: true };
    }),
});
