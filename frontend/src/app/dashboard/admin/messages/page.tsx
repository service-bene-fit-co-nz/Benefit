export const dynamic = "force-dynamic";

import { downloadMessengerHistory } from "@/server-actions/facebook/actions";
import MessagesManager from "@/components/dashboard/admin/messages/messages-manager";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const resolvedSearchParams = await (searchParams as any);
  const startDateParam = resolvedSearchParams.startDate;
  const endDateParam = resolvedSearchParams.endDate;

  const startDate = startDateParam ? new Date(startDateParam as string) : undefined;
  const endDate = endDateParam ? new Date(endDateParam as string) : undefined;

  const result = await downloadMessengerHistory(startDate, endDate);

  const messages = result.success ? result.data : [];
  const error = result.success ? null : result.message;

  return (
    <MessagesManager
      initialMessages={messages}
      error={error}
      initialStartDate={startDate?.toISOString()}
      initialEndDate={endDate?.toISOString()}
    />
  );
}
