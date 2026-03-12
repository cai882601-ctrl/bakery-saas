"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">You&apos;re Offline</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        BakeBoard needs an internet connection to sync your data.
        Some parts of the app may be available if you&apos;ve visited them recently.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={() => window.location.reload()} className="w-full">
          Retry Connection
        </Button>
        <Link href="/dashboard" className="w-full">
          <Button variant="outline" className="w-full">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
