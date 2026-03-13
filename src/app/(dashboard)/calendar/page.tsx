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
    <div className="space-y-6">
      {/* Header */}
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

      {/* Month Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPrevMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <h3 className="text-lg font-semibold" aria-live="polite">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <Button variant="outline" size="icon" onClick={goToNextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden" role="grid" aria-label="Calendar">
            {/* Weekday headers */}
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                role="columnheader"
                className="bg-muted px-1 py-2 text-center text-xs font-medium text-muted-foreground sm:text-sm"
              >
                <span className="sr-only">{day}</span>
                <span aria-hidden="true">{day.slice(0, 1)}</span>
                <span className="hidden sm:inline" aria-hidden="true">{day.slice(1)}</span>
              </div>
            ))}

            {/* Date cells */}
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${wi}-${di}`}
                      role="gridcell"
                      className="bg-background min-h-[60px] sm:min-h-[80px]"
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

                const ariaLabel = [
                  formatDisplayDate(dateStr),
                  isToday ? "Today" : "",
                  slotBlocked ? "Blocked" : `${currentOrders} of ${slotMaxOrders} orders`,
                  deliveryDates.has(dateStr) ? "Has deliveries" : "",
                ].filter(Boolean).join(", ");

                return (
                  <button
                    key={dateStr}
                    role="gridcell"
                    aria-label={ariaLabel}
                    onClick={() => openDateDialog(day)}
                    className={`bg-background min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset ${
                      isPast ? "opacity-50" : ""
                    } ${isToday ? "ring-2 ring-primary ring-inset" : ""} ${
                      slotBlocked ? "bg-destructive/5" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 sm:gap-1" aria-hidden="true">
                      <span
                        className={`text-xs font-medium sm:text-sm ${
                          isToday
                            ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground sm:h-6 sm:w-6"
                            : ""
                        }`}
                      >
                        {day}
                      </span>
                      {slotBlocked && (
                        <div className="flex items-center gap-0.5">
                          <Lock className="h-3 w-3 text-destructive" />
                          <span className="hidden text-[10px] text-destructive sm:inline">
                            Blocked
                          </span>
                        </div>
                      )}
                      {!slotBlocked && slot && (
                        <Badge
                          variant={isFull ? "destructive" : "secondary"}
                          className="w-fit px-1 py-0 text-[10px] sm:text-xs"
                        >
                          {currentOrders}/{slotMaxOrders}
                        </Badge>
                      )}
                      {deliveryDates.has(dateStr) && (
                        <div className="flex justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {isLoading && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Loading calendar data...
            </p>
          )}

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full ring-2 ring-primary" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-destructive" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                0/5
              </Badge>
              <span>Orders / Max</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Has deliveries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Detail Dialog */}
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
              {/* Current status */}
              {selectedSlot && (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <p className="text-sm font-medium">Current Orders</p>
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

              {/* Edit form */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="max-orders">Max Orders</Label>
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-blocked">Block this date</Label>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="block-reason">Block Reason</Label>
                    <Input
                      id="block-reason"
                      placeholder="e.g. Holiday, Maintenance..."
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
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

          <DialogFooter>
            {/* Quick block/unblock buttons */}
            {selectedSlot && (selectedSlot.is_blocked as boolean) ? (
              <Button
                variant="outline"
                onClick={handleQuickUnblock}
                disabled={isMutating}
              >
                <Unlock className="mr-1 h-3 w-3" />
                Quick Unblock
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleQuickBlock}
                disabled={isMutating}
                className="text-destructive"
              >
                <Lock className="mr-1 h-3 w-3" />
                Quick Block
              </Button>
            )}
            <Button onClick={handleSave} disabled={isMutating}>
              {isMutating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
