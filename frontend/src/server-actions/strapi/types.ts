import { ClientNote } from "@prisma/client";

export type FormFieldData =
  | {
      name: string;
      label: string;
      value: any; // Can be string, number, boolean, or another FormFieldData[]
    }
  | {
      name: string;
      label: string;
      value: FormFieldData[]; // For nested groups
    };

export type ClientNotePayload = FormFieldData[];

export type SubmissionType = "SubmitOnce" | "AllowUpdate" | "AllowMultiple";

export type SubmissionResult =
  | { success: true; message: string; submission?: ClientNote }
  | {
      success: false;
      error: string;
      code?: string;
      existingSubmissionId?: string;
    };
