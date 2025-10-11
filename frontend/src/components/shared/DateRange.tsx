import React, { useState, useEffect } from "react";
import { format, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface DateRangePickerProps {
  initialStartDate?: Date;
  initialEndDate?: Date;
  onDateRangeChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  initialStartDate,
  initialEndDate,
  onDateRangeChange,
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);

  useEffect(() => {
    setStartDate(initialStartDate);
  }, [initialStartDate]);

  useEffect(() => {
    setEndDate(initialEndDate);
  }, [initialEndDate]);

  useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
    }
  }, [startDate, endDate, onDateRangeChange]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Date Range</CardTitle>
        <CardDescription>
          Select a date range to view client data. (Max 7-days)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
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
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? (
                  format(startDate, "EEE, dd-MMM-yyyy")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(newDate: Date | undefined) => {
                  if (newDate) {
                    const normalizedDate = startOfDay(newDate);

                    setStartDate(normalizedDate);
                    if (
                      endDate &&
                      (Math.abs(differenceInDays(endDate, normalizedDate)) >
                        6 ||
                        normalizedDate > endDate)
                    ) {
                      const adjustedEndDate = new Date(normalizedDate);
                      adjustedEndDate.setDate(
                        adjustedEndDate.getDate() + 6
                      );
                      setEndDate(endOfDay(adjustedEndDate));
                      toast.info("Date Range Adjusted", {
                        description:
                          "End date adjusted to maintain a 7-day range.",
                      });
                    }
                    setIsStartDatePopoverOpen(false); // Close popover after selection
                  }
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
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? (
                  format(endDate, "EEE, dd-MMM-yyyy")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(newDate: Date | undefined) => {
                  if (newDate) {
                    // Normalize newDate to the end of the day to avoid timezone issues
                    const normalizedDate = endOfDay(newDate); // Use endOfDay
                    setEndDate(normalizedDate);
                    if (
                      startDate &&
                      (Math.abs(
                        differenceInDays(normalizedDate, startDate)
                      ) > 6 ||
                        normalizedDate < startDate)
                    ) {
                      const adjustedStartDate = new Date(normalizedDate);
                      adjustedStartDate.setDate(
                        adjustedStartDate.getDate() - 6
                      );
                      setStartDate(startOfDay(adjustedStartDate));
                      toast.info("Date Range Adjusted", {
                        description:
                          "Start date adjusted to maintain a 7-day range.",
                      });
                    }
                    setIsEndDatePopoverOpen(false); // Close popover after selection
                  }
                }}
                className="w-full"
                weekStartsOn={1}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};
