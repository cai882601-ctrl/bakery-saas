import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// Users — Baker accounts
// ============================================================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  avatarUrl: text("avatar_url"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  products: many(products),
  ingredients: many(ingredients),
  orders: many(orders),
  calendarSlots: many(calendarSlots),
}));

// ============================================================
// Customers — Client information
// ============================================================
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  source: varchar("source", { length: 50 }).default("direct"), // direct, instagram, facebook, website, referral
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  orders: many(orders),
}));

// ============================================================
// Products — Baked goods / recipes
// ============================================================
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // cakes, cookies, bread, pastries, etc.
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  prepTimeMinutes: integer("prep_time_minutes"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, { fields: [products.userId], references: [users.id] }),
  orderItems: many(orderItems),
  productIngredients: many(productIngredients),
}));

// ============================================================
// Ingredients — Raw materials + cost tracking
// ============================================================
export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // kg, g, lb, oz, ml, L, each
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 4 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  inStock: decimal("in_stock", { precision: 10, scale: 2 }).default("0"),
  lowStockThreshold: decimal("low_stock_threshold", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  user: one(users, { fields: [ingredients.userId], references: [users.id] }),
  productIngredients: many(productIngredients),
}));

// ============================================================
// Product Ingredients — Recipe junction table
// ============================================================
export const productIngredients = pgTable("product_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
});

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, { fields: [productIngredients.productId], references: [products.id] }),
  ingredient: one(ingredients, { fields: [productIngredients.ingredientId], references: [ingredients.id] }),
}));

// ============================================================
// Orders — Customer orders
// ============================================================
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  // pending, confirmed, in_progress, ready, delivered, cancelled
  source: varchar("source", { length: 50 }).default("direct"),
  // direct, instagram, facebook, website, phone, email
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  deliveryDate: date("delivery_date"),
  deliveryTime: varchar("delivery_time", { length: 20 }),
  deliveryMethod: varchar("delivery_method", { length: 50 }).default("pickup"),
  // pickup, delivery
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}));

// ============================================================
// Order Items — Line items per order
// ============================================================
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  customizations: text("customizations"),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

// ============================================================
// Calendar Slots — Availability / capacity management
// ============================================================
export const calendarSlots = pgTable("calendar_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  maxOrders: integer("max_orders").default(5),
  currentOrders: integer("current_orders").default(0),
  isBlocked: boolean("is_blocked").default(false),
  blockReason: varchar("block_reason", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const calendarSlotsRelations = relations(calendarSlots, ({ one }) => ({
  user: one(users, { fields: [calendarSlots.userId], references: [users.id] }),
}));
