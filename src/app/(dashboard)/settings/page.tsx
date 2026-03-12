import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your bakery profile and preferences.
        </p>
      </div>
      <Separator />
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Settings page coming soon. Configure your business details, notification preferences, and integrations.
      </div>
    </div>
  );
}
