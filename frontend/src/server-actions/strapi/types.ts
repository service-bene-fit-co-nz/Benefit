import { FormSubmission } from "@prisma/client";

export type FormFieldData = {
  name: string;
  label: string;
  value: any; // Can be string, number, boolean, or another FormFieldData[]
} | {
  name: string;
  label: string;
  value: FormFieldData[]; // For nested groups
};

export type FormSubmissionPayload = FormFieldData[];

export type SubmissionType = "SubmitOnce" | "AllowUpdate" | "AllowMultiple";

export type SubmissionResult =
  | { success: true; message: string; submission?: FormSubmission }
  | { success: false; error: string; code?: string; existingSubmissionId?: string };
