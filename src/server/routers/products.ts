import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { supabaseAdmin } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";

export const productsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from("products")
        .select("*")
        .order("name", { ascending: true })
        .limit(input.limit);

      if (input.activeOnly) {
        query = query.eq("is_active", true);
      }
      if (input.category) {
        query = query.eq("category", input.category);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { products: data ?? [] };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("*, product_ingredients(*, ingredients(name, unit, cost_per_unit))")
        .eq("id", input.id)
        .single();

      if (error) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      return data;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        category: z.string().optional().nullable(),
        basePrice: z.number().positive(),
        prepTimeMinutes: z.number().int().positive().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const userId = "00000000-0000-0000-0000-000000000000";

      const { data, error } = await supabaseAdmin
        .from("products")
        .insert({
          user_id: userId,
          name: input.name,
          description: input.description || null,
          category: input.category || null,
          base_price: input.basePrice.toFixed(2),
          prep_time_minutes: input.prepTimeMinutes || null,
        })
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
        description: z.string().optional().nullable(),
        category: z.string().optional().nullable(),
        basePrice: z.number().positive().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, basePrice, isActive, ...rest } = input;
      const updates: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
      if (basePrice !== undefined) updates.base_price = basePrice.toFixed(2);
      if (isActive !== undefined) updates.is_active = isActive;

      const { data, error } = await supabaseAdmin
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin.from("products").delete().eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  addIngredient: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        ingredientId: z.string().uuid(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("product_ingredients")
        .insert({
          product_id: input.productId,
          ingredient_id: input.ingredientId,
          quantity: input.quantity.toFixed(4),
        })
        .select("*, ingredients(name, unit, cost_per_unit)")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  removeIngredient: publicProcedure
    .input(z.object({ productIngredientId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from("product_ingredients")
        .delete()
        .eq("id", input.productIngredientId);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  updateIngredientQuantity: publicProcedure
    .input(
      z.object({
        productIngredientId: z.string().uuid(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from("product_ingredients")
        .update({ quantity: input.quantity.toFixed(4) })
        .eq("id", input.productIngredientId)
        .select("*, ingredients(name, unit, cost_per_unit)")
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  calculateCost: publicProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("base_price")
        .eq("id", input.productId)
        .single();

      if (productError) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });

      const { data: items, error: itemsError } = await supabaseAdmin
        .from("product_ingredients")
        .select("id, quantity, ingredients(name, unit, cost_per_unit)")
        .eq("product_id", input.productId);

      if (itemsError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: itemsError.message });

      const breakdown = (items ?? []).map((item: Record<string, unknown>) => {
        const ingredient = item.ingredients as Record<string, unknown>;
        const qty = parseFloat(item.quantity as string);
        const unitCost = parseFloat(ingredient.cost_per_unit as string);
        const lineCost = qty * unitCost;
        return {
          id: item.id as string,
          name: ingredient.name as string,
          unit: ingredient.unit as string,
          quantity: qty,
          unitCost,
          lineCost,
        };
      });

      const totalCost = breakdown.reduce((sum, b) => sum + b.lineCost, 0);
      const basePrice = parseFloat(product.base_price as string);
      const profit = basePrice - totalCost;
      const marginPercent = basePrice > 0 ? (profit / basePrice) * 100 : 0;
      const markup = totalCost > 0 ? ((basePrice - totalCost) / totalCost) * 100 : 0;

      return {
        breakdown,
        totalCost,
        basePrice,
        profit,
        marginPercent,
        markup,
      };
    }),
});
