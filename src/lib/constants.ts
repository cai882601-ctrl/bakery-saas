export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "In Progress", color: "bg-purple-100 text-purple-800" },
  { value: "ready", label: "Ready", color: "bg-green-100 text-green-800" },
  { value: "delivered", label: "Delivered", color: "bg-gray-100 text-gray-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

export const CUSTOMER_SOURCES = [
  { value: "direct", label: "Direct" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
] as const;

export const ORDER_SOURCES = [
  { value: "direct", label: "Direct" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: "cakes", label: "Cakes" },
  { value: "cookies", label: "Cookies" },
  { value: "bread", label: "Bread" },
  { value: "pastries", label: "Pastries" },
  { value: "pies", label: "Pies" },
  { value: "other", label: "Other" },
] as const;

export const INGREDIENT_UNITS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "lb", label: "lb" },
  { value: "oz", label: "oz" },
  { value: "ml", label: "mL" },
  { value: "L", label: "L" },
  { value: "cup", label: "cup" },
  { value: "tbsp", label: "tbsp" },
  { value: "tsp", label: "tsp" },
  { value: "each", label: "each" },
] as const;

export const STATUS_FLOW: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function getStatusInfo(status: string) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
