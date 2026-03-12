import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your recipes and pricing.</p>
        </div>
        <Button>Add Product</Button>
      </div>
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No products yet. Add your first product to get started.
      </div>
    </div>
  );
}
