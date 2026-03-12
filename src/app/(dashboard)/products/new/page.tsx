"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("");

  const createProduct = trpc.products.create.useMutation({
    onSuccess: (data) => {
      router.push(`/products/${data.id}`);
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !basePrice) return;

    createProduct.mutate({
      name: name.trim(),
      description: description.trim() || null,
      category: category || null,
      basePrice: parseFloat(basePrice),
      prepTimeMinutes: prepTimeMinutes ? parseInt(prepTimeMinutes, 10) : null,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Product</h2>
          <p className="text-muted-foreground">Add a new product to your menu.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder="e.g. Chocolate Layer Cake"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the product..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label>Base Price ($) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prep Time (minutes)</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 120"
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/products">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={createProduct.isPending || !name.trim() || !basePrice}
        >
          {createProduct.isPending ? "Creating..." : "Create Product"}
        </Button>
      </div>

      {createProduct.isError && (
        <p className="text-sm text-destructive">
          Error: {createProduct.error.message}
        </p>
      )}
    </div>
  );
}
