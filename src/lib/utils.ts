import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAriaSort(
  sortBy: string,
  currentField: string,
  sortOrder: "asc" | "desc"
) {
  if (sortBy !== currentField) return "none" as const;
  return sortOrder === "asc" ? ("ascending" as const) : ("descending" as const);
}

