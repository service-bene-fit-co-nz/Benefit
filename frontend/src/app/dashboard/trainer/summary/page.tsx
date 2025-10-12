"use client";

import { Suspense, useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import { Loading } from "@/components/ui/loading";
import { FindClient } from "@/components/dashboard/trainer/summary/FindClient";
import { DateRangePicker } from "@/components/shared/DateRange";
import { startOfWeek, endOfWeek } from "date-fns";
import { normalizeDate } from "@/utils/date-utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Summary = () => {
  const [startDate, setStartDate] = useState<Date>(() => {
    const start = normalizeDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    return start;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return normalizeDate(end);
  });

  const handleDateRangeChange = useCallback(
    (newStartDate: Date | undefined, newEndDate: Date | undefined) => {
      if (newStartDate) setStartDate(newStartDate);
      if (newEndDate) setEndDate(newEndDate);
    },
    []
  );

  return (
    <ProtectedRoute
      requiredRoles={[UserRole.Trainer, UserRole.Admin, UserRole.SystemAdmin]}
    >
      <div className="container mx-auto p-4 h-screen flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-4">
          Trainer Dashboard
        </h1>
        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          <ResizablePanel className="overflow-auto">
            <FindClient />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className="overflow-auto">
            <DateRangePicker
              initialStartDate={startDate}
              initialEndDate={endDate}
              onDateRangeChange={handleDateRangeChange}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ProtectedRoute>
  );
};

export default function SummaryWrapper() {
  return (
    <Suspense
      fallback={
        <Loading
          title="Loading Trainer Dashboard"
          description="Preparing your trainer view..."
        />
      }
    >
      <Summary />
    </Suspense>
  );
}
