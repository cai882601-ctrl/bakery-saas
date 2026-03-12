"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatCurrency, PRODUCT_CATEGORIES } from "@/lib/constants";
import { ArrowLeft, Plus, Trash2, Pencil, AlertCircle } from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [addIngOpen, setAddIngOpen] = useState(false);

  const { data: product, isLoading } = trpc.products.getById.useQuery({ id });
  const { data: allIngredients } = trpc.ingredients.list.useQuery({});
  const { data: costData } = trpc.products.calculateCost.useQuery({ productId: id });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.getById.invalidate({ id });
      utils.products.calculateCost.invalidate({ productId: id });
      setEditOpen(false);
    },
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      router.push("/products");
    },
  });

  const addIngredient = trpc.products.addIngredient.useMutation({
    onSuccess: () => {
      utils.products.getById.invalidate({ id });
      utils.products.calculateCost.invalidate({ productId: id });
      setAddIngOpen(false);
    },
  });

  const removeIngredient = trpc.products.removeIngredient.useMutation({
    onSuccess: () => {
      utils.products.getById.invalidate({ id });
      utils.products.calculateCost.invalidate({ productId: id });
    },
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    basePrice: "",
    prepTimeMinutes: "",
  });

  function openEditDialog() {
    if (!product) return;
    const p = product as Record<string, unknown>;
    setEditForm({
      name: (p.name as string) ?? "",
      description: (p.description as string) ?? "",
      category: (p.category as string) ?? "",
      basePrice: (p.base_price as string) ?? "0",
      prepTimeMinutes: p.prep_time_minutes ? String(p.prep_time_minutes) : "",
    });
    setEditOpen(true);
  }

  function handleSave() {
    updateProduct.mutate({
      id,
      name: editForm.name,
      description: editForm.description || null,
      category: editForm.category || null,
      basePrice: parseFloat(editForm.basePrice) || 0,
    });
  }

  function handleDelete() {
    deleteProduct.mutate({ id });
  }

  function handleAddIngredient(ingredientId: string, quantity: string) {
    if (!quantity || parseFloat(quantity) <= 0) return;
    addIngredient.mutate({
      productId: id,
      ingredientId,
      quantity: parseFloat(quantity),
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href="/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>
    );
  }

  const p = product as Record<string, unknown>;
  const recipeIngredients = (p.product_ingredients as Array<Record<string, unknown>>) ?? [];
  const basePrice = parseFloat((p.base_price as string) ?? "0");
  const totalCost = costData?.totalCost ?? 0;
  const profit = basePrice - totalCost;
  const marginPercent = basePrice > 0 ? (profit / basePrice) * 100 : 0;

  let marginColor = "text-green-600";
  if (marginPercent < 40) marginColor = "text-red-600";
  else if (marginPercent < 60) marginColor = "text-yellow-600";

  const usedIngredientIds = new Set(
    recipeIngredients.map((pi) => pi.ingredient_id as string)
  );
  const availableIngredients = ((allIngredients?.ingredients ?? []) as Array<Record<string, unknown>>).filter(
    (ing) => !usedIngredientIds.has(ing.id as string)
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon" aria-label="Back to products">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{p.name as string}</h2>
            <p className="text-sm text-muted-foreground">
              {p.category ? `Category: ${p.category}` : "No category"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>

          {!deleteConfirm ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Confirm Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(v) => setEditForm((f) => ({ ...f, category: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-base-price">Base Price ($)</Label>
              <Input
                id="edit-base-price"
                type="number"
                step="0.01"
                value={editForm.basePrice}
                onChange={(e) => setEditForm((f) => ({ ...f, basePrice: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prep-time">Prep Time (minutes)</Label>
              <Input
                id="edit-prep-time"
                type="number"
                value={editForm.prepTimeMinutes}
                onChange={(e) => setEditForm((f) => ({ ...f, prepTimeMinutes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editForm.name}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Base Price</p>
              <p className="text-2xl font-bold">{formatCurrency(basePrice)}</p>
            </div>

            {p.prep_time_minutes ? (
              <div>
                <p className="text-sm text-muted-foreground">Prep Time</p>
                <p className="font-medium">{(p.prep_time_minutes as number)} minutes</p>
              </div>
            ) : null}

            {p.description ? (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{p.description as string}</p>
              </div>
            ) : null}

            <Separator />

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={p.is_active ? "default" : "secondary"}>
                {(p.is_active as boolean) ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Cost Calculator */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recipe Cost Calculator</CardTitle>
            <Button size="sm" onClick={() => setAddIngOpen(true)}>
              <Plus className="mr-2 h-3 w-3" />
              Add Ingredient
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ingredients Table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Qty</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Cost/Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeIngredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                        No ingredients yet. Add ingredients to calculate costs.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipeIngredients.map((pi) => {
                      const ing = pi.ingredients as Record<string, unknown>;
                      const qty = parseFloat((pi.quantity as string) ?? "0");
                      const unitCost = parseFloat((ing.cost_per_unit as string) ?? "0");
                      const lineTotal = qty * unitCost;
                      return (
                        <TableRow key={pi.id as string}>
                          <TableCell className="font-medium">{ing.name as string}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right">{qty}</TableCell>
                          <TableCell className="hidden sm:table-cell">{ing.unit as string}</TableCell>
                          <TableCell className="hidden md:table-cell text-right">
                            {formatCurrency(unitCost)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(lineTotal)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label={`Remove ${ing.name as string}`}
                              onClick={() =>
                                removeIngredient.mutate({ productIngredientId: pi.id as string })
                              }
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Add Ingredient Popover */}
            <Popover open={addIngOpen} onOpenChange={setAddIngOpen}>
              <PopoverTrigger className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <AddIngredientForm
                  availableIngredients={availableIngredients}
                  onSelect={handleAddIngredient}
                />
              </PopoverContent>
            </Popover>

            <Separator />

            {/* Summary */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <p className="text-muted-foreground">Total Ingredient Cost</p>
                <p className="font-medium">{formatCurrency(totalCost)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-muted-foreground">Base Price</p>
                <p className="font-medium">{formatCurrency(basePrice)}</p>
              </div>
              <Separator />
              <div className="flex justify-between">
                <p className="font-semibold">Profit</p>
                <p className={`font-bold ${marginColor}`}>{formatCurrency(profit)}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-semibold">Margin</p>
                <p className={`font-bold ${marginColor}`}>{marginPercent.toFixed(1)}%</p>
              </div>

              {marginPercent < 40 && recipeIngredients.length > 0 && (
                <div className="flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>Low margin detected. Consider increasing price or reducing costs.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddIngredientForm({
  availableIngredients,
  onSelect,
}: {
  availableIngredients: Array<Record<string, unknown>>;
  onSelect: (ingredientId: string, quantity: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");

  const selectedIng = selectedId
    ? availableIngredients.find((i) => (i.id as string) === selectedId)
    : null;

  return (
    <div className="space-y-3 p-3">
      <Command>
        <CommandInput placeholder="Search ingredients..." />
        <CommandList>
          <CommandEmpty>No ingredients found.</CommandEmpty>
          <CommandGroup>
            {availableIngredients.map((ing) => (
              <CommandItem
                key={ing.id as string}
                value={ing.name as string}
                onSelect={() => setSelectedId(ing.id as string)}
              >
                <div className="flex-1">
                  <p className="font-medium">{ing.name as string}</p>
                  <p className="text-xs text-muted-foreground">
                    {ing.unit as string} @ {formatCurrency(parseFloat((ing.cost_per_unit as string) ?? "0"))}/unit
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      {selectedIng && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">{selectedIng.name as string}</p>
          <Label htmlFor="qty">Quantity ({selectedIng.unit as string})</Label>
          <Input
            id="qty"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Button
            className="w-full"
            size="sm"
            onClick={() => {
              onSelect(selectedId!, quantity);
              setSelectedId(null);
              setQuantity("");
            }}
            disabled={!quantity || parseFloat(quantity) <= 0}
          >
            Add to Recipe
          </Button>
        </div>
      )}
    </div>
  );
}
