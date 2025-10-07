"use client";

import { useQuery, QueryFunctionContext } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { getFormSubmissions } from "@/server-actions/strapi/actions";
import { FormSubmission } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientFormSubmissionsProps {
  clientId: string;
}

const fetchClientFormSubmissions = async (context: QueryFunctionContext): Promise<FormSubmission[]> => {
  const [_key, clientId] = context.queryKey as [string, string];

  if (!clientId) {
    return [];
  }

  const formSubmissionsResult = await getFormSubmissions(clientId);

  if (!formSubmissionsResult.success) {
    throw new Error(
      formSubmissionsResult.error || "Could not retrieve client form submissions."
    );
  }
  return formSubmissionsResult.submissions || [];
};

export const ClientFormSubmissions = ({
  clientId,
}: ClientFormSubmissionsProps) => {
  const {
    data: clientFormSubmissions = [],
    isLoading: isLoadingFormSubmissions,
    error: clientFormSubmissionsError,
  } = useQuery({
    queryKey: ["clientFormSubmissions", clientId],
    queryFn: fetchClientFormSubmissions,
    enabled: !!clientId,
  });

  if (clientFormSubmissionsError) {
    console.error("Failed to fetch client form submissions:", clientFormSubmissionsError);
    toast.error("Failed to load form submissions", {
      description: (clientFormSubmissionsError as Error).message,
    });
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Client Form Submissions</CardTitle>
        {!isLoadingFormSubmissions && clientFormSubmissions.length === 0 && ( // Only show description if no submissions and not loading
          <CardDescription>
            Summary of client's form submissions will be displayed here.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingFormSubmissions ? (
          <Loading
            title="Loading Client Form Submissions"
            description="Fetching client's form submission data..."
            size="sm"
          />
        ) : clientFormSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientFormSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.formUniqueName || "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(submission.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(submission.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No form submissions found for this client.</p>
        )}
      </CardContent>
    </Card>
  );
};
