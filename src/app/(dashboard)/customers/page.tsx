import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage your customer relationships.</p>
        </div>
        <Button>Add Customer</Button>
      </div>
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No customers yet. Add your first customer to get started.
      </div>
    </div>
  );
}
