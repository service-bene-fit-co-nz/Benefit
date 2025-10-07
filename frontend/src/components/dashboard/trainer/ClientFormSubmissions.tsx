"use client";

import { useQuery, QueryFunctionContext, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteFormSubmission, getFormSubmissions } from "@/server-actions/strapi/actions";
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

const formatFormDataAsText = (formData: any[] | null | undefined): string => {
  if (!Array.isArray(formData)) {
    return "No form data available.";
  }
  let formattedText = "";
  formData.forEach((section) => {
    if (section.label) {
      formattedText += `${section.label}:\n`;
    }
    if (Array.isArray(section.value)) {
      section.value.forEach((field: any) => {
        if (field.label && field.value !== undefined) {
          formattedText += `  ${field.label}: ${field.value}\n`;
        }
      });
    }
    formattedText += "\n"; // Add a blank line between sections
  });
  return formattedText.trim(); // Remove trailing newline
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

  const queryClient = useQueryClient();

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewedFormData, setViewedFormData] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [submissionToDeleteId, setSubmissionToDeleteId] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy to clipboard.");
    }
  }, []);

  const handleDeleteSubmission = useCallback(async () => {
    if (!submissionToDeleteId) return;

    // Call the server action to delete the submission
    await deleteFormSubmission(submissionToDeleteId);

    toast.success("Form submission deleted successfully.");
    setIsDeleteDialogOpen(false);
    setSubmissionToDeleteId(null);
    queryClient.invalidateQueries({ queryKey: ["clientFormSubmissions", clientId] });
  }, [submissionToDeleteId, queryClient, clientId]);

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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog open={isViewModalOpen && viewedFormData?.id === submission.id} onOpenChange={setIsViewModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewedFormData(submission);
                                setIsViewModalOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                              <DialogTitle>Form Submission Data</DialogTitle>
                              <DialogDescription>
                                Raw JSON data for the submission.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <pre className="whitespace-pre-wrap rounded-md bg-gray-100 p-4 text-sm max-h-[80vh] overflow-y-auto text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                                {formatFormDataAsText(viewedFormData?.formData)}
                              </pre>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    formatFormDataAsText(viewedFormData?.formData),
                                    "Formatted text copied to clipboard!"
                                  )
                                }
                              >
                                Copy as Text
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    JSON.stringify(viewedFormData?.formData),
                                    "Raw JSON copied to clipboard!"
                                  )
                                }
                              >
                                Copy as JSON
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog open={isDeleteDialogOpen && submissionToDeleteId === submission.id} onOpenChange={setIsDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSubmissionToDeleteId(submission.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                form submission.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteSubmission}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
