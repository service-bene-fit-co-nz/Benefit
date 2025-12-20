"use client";

import { downloadMessengerHistory } from "@/server-actions/facebook/actions";
import MessagesManager from "@/components/dashboard/admin/messages/messages-manager";
import { useSearchParams } from "next/navigation";
import { useQuery, QueryFunctionContext } from "@tanstack/react-query";
import { ActionResult } from "@/types/server-action-results";

const getMessengerHistory = async (
  context: QueryFunctionContext
): Promise<any[]> => {
  const [_key, startDate, endDate] = context.queryKey;

  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    return [];
  }

  const result: ActionResult<any[]> = await downloadMessengerHistory(
    startDate,
    endDate
  );

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch Fitbit activities.");
  }

  return result.data;
};

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const startDate = startDateParam
    ? new Date(startDateParam as string)
    : undefined;
  const endDate = endDateParam ? new Date(endDateParam as string) : undefined;

  const {
    data: facebookMessages = [],
    isLoading: isLoadingFacebookMessages,
    error: facebookMessagesError,
  } = useQuery({
    queryKey: ["facebookMessages", startDate, endDate],
    queryFn: getMessengerHistory,
    enabled: true,
  });

  return (
    <MessagesManager
      initialMessages={facebookMessages}
      error={facebookMessagesError ? facebookMessagesError.message : null}
      initialStartDate={startDate?.toISOString()}
      initialEndDate={endDate?.toISOString()}
    />
  );
}
