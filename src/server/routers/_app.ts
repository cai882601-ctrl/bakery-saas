import { createTRPCRouter } from "../trpc";
import { ordersRouter } from "./orders";
import { customersRouter } from "./customers";
import { productsRouter } from "./products";
import { ingredientsRouter } from "./ingredients";
import { calendarRouter } from "./calendar";

export const appRouter = createTRPCRouter({
  orders: ordersRouter,
  customers: customersRouter,
  products: productsRouter,
  ingredients: ingredientsRouter,
  calendar: calendarRouter,
});

export type AppRouter = typeof appRouter;
