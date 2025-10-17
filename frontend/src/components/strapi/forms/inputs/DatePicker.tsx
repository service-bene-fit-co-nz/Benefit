"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  name: string;
  label: string;
  required: boolean;
  value?: Date;
  onChange: (date?: Date) => void;
  fromYear?: number;
  toYear?: number;
  disabled?: (date: Date) => boolean;
}

const DatePicker = ({
  name,
  label,
  required,
  value,
  onChange,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  disabled,
}: DatePickerProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    value || new Date()
  );

  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 font-medium">
        {label}
      </label>
      <Popover
        open={isDatePickerOpen}
        onOpenChange={(open) => {
          setIsDatePickerOpen(open);
          if (open) {
            setDisplayMonth(value || new Date());
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "EEE, dd-MMM-yyyy")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Quick Navigation</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((year) => (
                <Button
                  key={year}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(displayMonth);
                    newDate.setFullYear(year);
                    setDisplayMonth(newDate);
                  }}
                  className="text-xs"
                >
                  {year}s
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (onChange) {
                onChange(date);
              }
              setIsDatePickerOpen(false);
            }}
            disabled={disabled}
            captionLayout="dropdown"
            fromYear={fromYear}
            toYear={toYear}
            weekStartsOn={1}
            className="w-full"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;