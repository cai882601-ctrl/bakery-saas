"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Lock,
  Unlock,
  Settings,
  Truck,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstDay).fill(null) as (number | null)[];

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// ── types ────────────────────────────────────────────────

type SlotData = Record<string, unknown>;

// ── component ────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // form state
  const [maxOrders, setMaxOrders] = useState(5);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // date range for query
  const startDate = toDateStr(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const endDate = toDateStr(viewYear, viewMonth, daysInMonth);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.calendar.getSlots.useQuery({
    startDate,
    endDate,
  });

  const { data: deliveryData } = trpc.orders.getDeliveryDates.useQuery({
    startDate,
    endDate,
  });

  const upsertSlot = trpc.calendar.upsertSlot.useMutation({
    onSuccess: () => {
      utils.calendar.getSlots.invalidate();
      setDialogOpen(false);
    },
  });

  const blockDate = trpc.calendar.blockDate.useMutation({
    onSuccess: () => {
      utils.calendar.getSlots.invalidate();
      setDialogOpen(false);
    },
  });

  const unblockDate = trpc.calendar.unblockDate.useMutation({
    onSuccess: () => {
      utils.calendar.getSlots.invalidate();
      setDialogOpen(false);
    },
  });

  // index slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, SlotData> = {};
    if (data?.slots) {
      for (const slot of data.slots as SlotData[]) {
        map[slot.date as string] = slot;
      }
    }
    return map;
  }, [data]);

  // dates that have order deliveries
  const deliveryDates = useMemo(() => {
    return new Set(deliveryData?.dates ?? []);
  }, [deliveryData]);

  const weeks = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // navigation
  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // open date dialog
  const openDateDialog = (day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    const slot = slotsByDate[dateStr];
    setSelectedDate(dateStr);
    setMaxOrders(slot ? (slot.max_orders as number) : 5);
    setIsBlocked(slot ? (slot.is_blocked as boolean) : false);
    setBlockReason(slot ? ((slot.block_reason as string) ?? "") : "");
    setNotes(slot ? ((slot.notes as string) ?? "") : "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    upsertSlot.mutate({
      date: selectedDate,
      maxOrders: maxOrders,
      isBlocked: isBlocked,
      blockReason: blockReason || undefined,
      notes: notes || undefined,
    });
  };

  const handleQuickBlock = () => {
    if (!selectedDate) return;
    blockDate.mutate({ date: selectedDate, reason: blockReason || undefined });
  };

  const handleQuickUnblock = () => {
    if (!selectedDate) return;
    unblockDate.mutate({ date: selectedDate });
  };

  const isMutating = upsertSlot.isPending || blockDate.isPending || unblockDate.isPending;
  const selectedSlot = selectedDate ? slotsByDate[selectedDate] : null;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
            <p className="text-muted-foreground">
              Manage your availability and order schedule.
            </p>
          </div>
          <Button variant="outline" onClick={goToToday}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold" aria-live="polite">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h3>
                <div className="flex items-center rounded-md border">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none border-r"
                    onClick={goToPrevMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    onClick={goToNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Deliveries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-destructive" />
                  <span>Blocked</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border" role="grid" aria-label="Calendar">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  role="columnheader"
                  className="bg-muted px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground sm:text-sm"
                >
                  <span className="sr-only">{day}</span>
                  <span aria-hidden="true">{day.slice(0, 3)}</span>
                </div>
              ))}

              {weeks.flatMap((week, wi) =>
                week.map((day, di) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${wi}-${di}`}
                        role="gridcell"
                        className="bg-background/50 min-h-[80px] sm:min-h-[100px]"
                      />
                    );
                  }

                  const dateStr = toDateStr(viewYear, viewMonth, day);
                  const slot = slotsByDate[dateStr];
                  const isPast = dateStr < todayStr;
                  const isToday = dateStr === todayStr;
                  const slotBlocked = slot ? (slot.is_blocked as boolean) : false;
                  const currentOrders = slot ? (slot.current_orders as number) : 0;
                  const slotMaxOrders = slot ? (slot.max_orders as number) : 5;
                  const isFull = currentOrders >= slotMaxOrders && !slotBlocked;
                  const hasDeliveries = deliveryDates.has(dateStr);

                  const ariaLabel = [
                    formatDisplayDate(dateStr),
                    isToday ? "Today" : "",
                    slotBlocked ? "Blocked" : `${currentOrders} of ${slotMaxOrders} orders`,
                    hasDeliveries ? "Has deliveries" : "",
                  ].filter(Boolean).join(", ");

                  return (
                    <Tooltip key={dateStr}>
                      <TooltipTrigger
                        render={
                          <button
                            role="gridcell"
                            aria-label={ariaLabel}
                            onClick={() => openDateDialog(day)}
                            className={`bg-background relative min-h-[80px] sm:min-h-[100px] p-2 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset ${
                              isPast ? "opacity-50" : ""
                            } ${
                              isToday ? "bg-primary/5 ring-1 ring-primary ring-inset" : ""
                            } ${slotBlocked ? "bg-destructive/5" : ""}`}
                          >
                            <div
                              className="flex h-full flex-col justify-between"
                              aria-hidden="true"
                            >
                              <div className="flex items-start justify-between">
                                <span
                                  className={`text-sm font-semibold sm:text-base ${
                                    isToday
                                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {day}
                                </span>
                                {slotBlocked && (
                                  <Lock className="h-3.5 w-3.5 text-destructive" />
                                )}
                              </div>

                              <div className="flex flex-col gap-1 mt-auto">
                                {!slotBlocked && (
                                  <Badge
                                    variant={isFull ? "destructive" : "outline"}
                                    className={`w-fit px-1 py-0 text-[10px] sm:text-xs font-normal ${
                                      !isFull && currentOrders > 0
                                        ? "border-primary/30 bg-primary/5"
                                        : ""
                                    }`}
                                  >
                                    {currentOrders}/{slotMaxOrders}
                                  </Badge>
                                )}
                                {hasDeliveries && (
                                  <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
                                    <Truck className="h-3 w-3" />
                                    <span className="hidden sm:inline">Delivery</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        }
                      />
                      {hasDeliveries && (
                        <TooltipContent>
                          Order deliveries scheduled for today
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <p className="mt-4 text-center text-sm text-muted-foreground animate-pulse">
            Loading calendar data...
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {selectedDate ? formatDisplayDate(selectedDate) : "Date Settings"}
            </DialogTitle>
          </DialogHeader>

          {selectedDate && (
            <div className="space-y-4">
              {selectedSlot && (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Orders</p>
                      <p className="text-2xl font-bold">
                        {selectedSlot.current_orders as number}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}/ {selectedSlot.max_orders as number}
                        </span>
                      </p>
                    </div>
                    {(selectedSlot.is_blocked as boolean) && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-orders">Daily Order Limit</Label>
                  <Input
                    id="max-orders"
                    type="number"
                    min={1}
                    value={maxOrders}
                    onChange={(e) =>
                      setMaxOrders(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-blocked">Accepting Orders</Label>
                  </div>
                  <Button
                    id="is-blocked"
                    variant={isBlocked ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsBlocked(!isBlocked)}
                  >
                    {isBlocked ? (
                      <>
                        <Lock className="mr-1 h-3 w-3" />
                        Blocked
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-1 h-3 w-3" />
                        Open
                      </>
                    )}
                  </Button>
                </div>

                {isBlocked && (
                  <div className="space-y-2">
                    <Label htmlFor="block-reason">Block Reason</Label>
                    <Input
                      id="block-reason"
                      placeholder="e.g. Holiday, Maintenance..."
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any notes for this date..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <div className="flex flex-1 gap-2">
              {selectedSlot && (selectedSlot.is_blocked as boolean) ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleQuickUnblock}
                  disabled={isMutating}
                >
                  <Unlock className="mr-2 h-3 w-3" />
                  Quick Unblock
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/5"
                  onClick={handleQuickBlock}
                  disabled={isMutating}
                >
                  <Lock className="mr-2 h-3 w-3" />
                  Quick Block
                </Button>
              )}
            </div>
            <Button onClick={handleSave} disabled={isMutating} className="w-full sm:w-auto">
              {isMutating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
