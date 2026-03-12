import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">Manage your bakery orders.</p>
        </div>
        <Button>New Order</Button>
      </div>
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No orders yet. Create your first order to get started.
      </div>
    </div>
  );
}
