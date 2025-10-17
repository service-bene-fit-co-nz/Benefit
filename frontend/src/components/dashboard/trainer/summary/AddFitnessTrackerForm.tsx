import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import DatePicker from "@/components/strapi/forms/inputs/DatePicker";
import { useMediaQuery } from "@/hooks/use-media-query";
import { startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import { toast } from "sonner";
import {
  fetchRawFitbitData,
  saveFitbitRawData,
} from "@/server-actions/fitbit/actions";

const formSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export type AddFitnessTrackerFormValues = z.infer<typeof formSchema>;

interface AddFitnessTrackerFormProps {
  onSubmit?: (values: AddFitnessTrackerFormValues) => void;

  onCancel: () => void;

  isSubmitting: boolean;

  clientId: string; // Add clientId prop
  onRecordAdded?: () => void; // New prop
}

export const AddFitnessTrackerForm: React.FC<AddFitnessTrackerFormProps> = ({
  onSubmit,

  onCancel,

  isSubmitting,

  clientId,
  onRecordAdded,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)"); // md breakpoint for horizontal alignment

    const [fitnessRecords, setFitnessRecords] = useState<any[]>([]);

  

    const [fetchedRawData, setFetchedRawData] = useState<any[] | null>(null); // To store the raw data object

  

    const [isFetchingRecords, setIsFetchingRecords] = useState(false);

  

    const [isSavingData, setIsSavingData] = useState(false);

  const today = new Date();

  const defaultStartDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const defaultEndDate = endOfWeek(today, { weekStartsOn: 0 }); // Sunday of current week (assuming week starts Sunday for this calculation)

  const form = useForm<AddFitnessTrackerFormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      startDate: defaultStartDate,

      endDate: defaultEndDate,
    },
  });

  const handleFetchData = async (values: AddFitnessTrackerFormValues) => {
    setIsFetchingRecords(true);

          setFitnessRecords([]); // Clear previous records

          setFetchedRawData(null); // Clear previous fetched raw data

    try {
      const result = await fetchRawFitbitData(
        clientId,

        values.startDate,

        values.endDate
      );

      if (result.success) {
        setFitnessRecords(result.data);

        setFetchedRawData(result.data); // Store the raw data object

        toast.success("Fitness records fetched successfully!");
      } else {
        toast.error("Failed to fetch fitness records", {
          description: result.message || "An unknown error occurred.",
        });
      }
    } catch (error) {
      toast.error("Failed to fetch fitness records", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsFetchingRecords(false);
    }
  };

  const handleSaveData = async () => {
    if (!fetchedRawData) {
      toast.error("No data to save", {
        description: "Please fetch fitness data first.",
      });

      return;
    }

    setIsSavingData(true);

    try {
      const result = await saveFitbitRawData(
        clientId,

        format(form.getValues().startDate, "yyyy-MM-dd"),

        format(form.getValues().endDate, "yyyy-MM-dd"),

        fetchedRawData
      );

      if (result.success) {
        toast.success(result.message || "Data saved successfully!");

        onRecordAdded?.(); // Call onRecordAdded if it exists

        onCancel(); // Close the form after saving
      } else {
        toast.error("Failed to save data", {
          description: result.message || "An unknown error occurred.",
        });
      }
    } catch (error) {
      toast.error("Failed to save data", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSavingData(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className={isDesktop ? "flex gap-4" : "space-y-4"}>
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex-1">
                <DatePicker
                  name={field.name}
                  label="Start Date"
                  required
                  value={field.value}
                  onChange={field.onChange}
                />

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex-1">
                <DatePicker
                  name={field.name}
                  label="End Date"
                  required
                  value={field.value}
                  onChange={field.onChange}
                />

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="h-48 overflow-y-auto border rounded-md p-2 mt-4">
          {isFetchingRecords ? (
            <p className="text-muted-foreground">Fetching records...</p>
          ) : fitnessRecords.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Activity Name</th>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-left p-2">Calories</th>
                  <th className="text-left p-2">Steps</th>
                </tr>
              </thead>
              <tbody>
                {fitnessRecords.map((record, rowIndex) => {
                  const startTime = new Date(record.startTime);
                  const date = format(startTime, "dd-MMM-yyyy");
                  const time = format(startTime, "HH:mm");
                  const durationMs = record.duration || 0;
                  const durationHours = Math.floor(durationMs / 3600000);
                  const durationMinutes = Math.floor(
                    (durationMs % 3600000) / 60000
                  );
                  const formattedDuration = `${durationHours}h ${durationMinutes}m`;

                  return (
                    <tr key={rowIndex} className="border-b last:border-b-0">
                      <td className="p-2">{date}</td>
                      <td className="p-2">{time}</td>
                      <td className="p-2">{record.activityName}</td>
                      <td className="p-2">{formattedDuration}</td>
                      <td className="p-2">{record.calories}</td>
                      <td className="p-2">{record.steps || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">
              No fitness records found for the selected period.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(handleFetchData)}
            disabled={isFetchingRecords}
          >
            {isFetchingRecords ? "Fetching..." : "Fetch Fitness Data"}
          </Button>
          <Button
            type="button"
            onClick={handleSaveData}
            disabled={!fetchedRawData || isSavingData}
          >
            {isSavingData ? "Saving..." : "Save Fitness Data"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
