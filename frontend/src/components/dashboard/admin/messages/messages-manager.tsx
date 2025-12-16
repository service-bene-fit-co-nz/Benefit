"use client";

import { useState, useEffect, useTransition } from "react";
import { FlatMessage } from "@/server-actions/facebook/types";
import MessageList from "@/components/facebook/message-list";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function MessagesManager({
  initialMessages,
  error,
  initialStartDate,
  initialEndDate,
}: {
  initialMessages: FlatMessage[];
  error: string | null;
  initialStartDate?: string;
  initialEndDate?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({
    startDate: initialStartDate ? new Date(initialStartDate) : undefined,
    endDate: initialEndDate ? new Date(initialEndDate) : undefined,
  });
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);

  // Effect to update filters when initial dates change (e.g., from URL)
  useEffect(() => {
    setFilters({
      startDate: initialStartDate ? new Date(initialStartDate) : undefined,
      endDate: initialEndDate ? new Date(initialEndDate) : undefined,
    });
  }, [initialStartDate, initialEndDate]);

  const handleFilterChange = (newStartDate?: Date, newEndDate?: Date) => {
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      if (newStartDate) {
        params.set("startDate", newStartDate.toISOString());
      } else {
        params.delete("startDate");
      }
      if (newEndDate) {
        params.set("endDate", newEndDate.toISOString());
      } else {
        params.delete("endDate");
      }
      router.push(`?${params.toString()}`);
    });
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="text-lg text-red-600">Could Not Load Messages</div>
        <div className="mt-2 text-sm text-gray-600 max-w-md">{error}</div>
        <p className="mt-4 text-xs text-gray-500">
          There might be an issue with the Facebook integration or environment
          variables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Messages</h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <Label>Start Date</Label>
          <Popover
            open={isStartDatePopoverOpen}
            onOpenChange={setIsStartDatePopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "dd-MMM-yyyy")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(newDate: Date | undefined) => {
                  setFilters((prev) => ({ ...prev, startDate: newDate }));
                  setIsStartDatePopoverOpen(false);
                  handleFilterChange(newDate, filters.endDate);
                }}
                className="w-full"
                weekStartsOn={1}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1">
          <Label>End Date</Label>
          <Popover
            open={isEndDatePopoverOpen}
            onOpenChange={setIsEndDatePopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
                disabled={isPending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "dd-MMM-yyyy")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(newDate: Date | undefined) => {
                  setFilters((prev) => ({ ...prev, endDate: newDate }));
                  setIsEndDatePopoverOpen(false);
                  handleFilterChange(filters.startDate, newDate);
                }}
                className="w-full"
                weekStartsOn={1}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <Button
          className="w-full md:flex-1"
          onClick={() => {
            setFilters({});
            handleFilterChange(undefined, undefined);
          }}
          disabled={isPending}
        >
          Clear Filters
        </Button>
      </div>

      <div className="bg-muted/50 rounded-xl">
        {initialMessages.length > 0 ? (
          <MessageList messages={initialMessages} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="text-lg text-gray-600">No messages found.</div>
            <p className="mt-2 text-sm text-gray-500">
              There are no recent messages to display for the selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
