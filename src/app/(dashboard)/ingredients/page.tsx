"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/constants";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";

const UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "oz", label: "Ounce (oz)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "L", label: "Liter (L)" },
  { value: "each", label: "Each" },
];

export default function IngredientsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = trpc.ingredients.list.useQuery({});
  const utils = trpc.useUtils();

  const createMutation = trpc.ingredients.create.useMutation({
    onSuccess: () => {
      utils.ingredients.list.invalidate();
      setIsDialogOpen(false);
    },
  });

  const updateMutation = trpc.ingredients.update.useMutation({
    onSuccess: () => {
      utils.ingredients.list.invalidate();
      setEditingId(null);
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = trpc.ingredients.delete.useMutation({
    onSuccess: () => {
      utils.ingredients.list.invalidate();
      setDeleteConfirm(null);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    unit: "g",
    costPerUnit: "",
    supplier: "",
    inStock: "",
    lowStockThreshold: "",
  });

  function handleOpenDialog(ingredient?: Record<string, unknown>) {
    if (ingredient) {
      setEditingId(ingredient.id as string);
      setFormData({
        name: (ingredient.name as string) ?? "",
        unit: (ingredient.unit as string) ?? "g",
        costPerUnit: (ingredient.cost_per_unit as string) ?? "",
        supplier: (ingredient.supplier as string) ?? "",
        inStock: (ingredient.in_stock as string) ?? "",
        lowStockThreshold: (ingredient.low_stock_threshold as string) ?? "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        unit: "g",
        costPerUnit: "",
        supplier: "",
        inStock: "",
        lowStockThreshold: "",
      });
    }
    setIsDialogOpen(true);
  }

  function handleSubmit() {
    const payload = {
      name: formData.name,
      unit: formData.unit,
      costPerUnit: parseFloat(formData.costPerUnit) || 0,
      supplier: formData.supplier || null,
      inStock: parseFloat(formData.inStock) || 0,
      lowStockThreshold: parseFloat(formData.lowStockThreshold) || 0,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const ingredients = (data?.ingredients ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ingredients</h2>
          <p className="text-muted-foreground">
            {ingredients.length} ingredients in inventory
          </p>
        </div>
        <Button onClick={() => {
          handleOpenDialog();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ingredient
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Ingredient" : "New Ingredient"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ing-name">Name *</Label>
                <Input
                  id="ing-name"
                  placeholder="e.g., All-Purpose Flour"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ing-unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) =>
                      setFormData((f) => ({ ...f, unit: v ?? "g" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ing-cost">Cost per Unit *</Label>
                  <Input
                    id="ing-cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPerUnit}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, costPerUnit: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ing-supplier">Supplier</Label>
                <Input
                  id="ing-supplier"
                  placeholder="e.g., Local Bakery Supply"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, supplier: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ing-stock">In Stock</Label>
                  <Input
                    id="ing-stock"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.inStock}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, inStock: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ing-threshold">Low Stock Threshold</Label>
                  <Input
                    id="ing-threshold"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        lowStockThreshold: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.costPerUnit}
              >
                {editingId ? "Save Changes" : "Add Ingredient"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">Loading ingredients...</p>
            </div>
          ) : ingredients.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">
                No ingredients yet. Add your first ingredient to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Unit</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Cost/Unit
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Supplier
                  </TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => {
                  const inStock = parseFloat((ing.in_stock as string) ?? "0");
                  const threshold = parseFloat(
                    (ing.low_stock_threshold as string) ?? "0"
                  );
                  const isLowStock = threshold > 0 && inStock < threshold;

                  return (
                    <TableRow key={ing.id as string}>
                      <TableCell className="font-medium">
                        {ing.name as string}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {ing.unit as string}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-medium">
                        {formatCurrency(
                          (ing.cost_per_unit as string) ?? "0"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {(ing.supplier as string) || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? "text-red-600 font-semibold" : ""}>
                            {inStock}
                          </span>
                          {isLowStock && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Low
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit ${ing.name as string}`}
                            onClick={() => handleOpenDialog(ing)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {deleteConfirm === (ing.id as string) ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                deleteMutation.mutate({
                                  id: ing.id as string,
                                })
                              }
                            >
                              Confirm
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete ${ing.name as string}`}
                              onClick={() =>
                                setDeleteConfirm(ing.id as string)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
