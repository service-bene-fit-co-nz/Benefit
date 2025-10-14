"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ClientNotePayload, SubmissionResult, SubmissionType } from "./types";

// Helper to get client ID from session or form email
async function getClientId(formEmail?: string): Promise<string | null> {
  const session = await getServerSession(authOptions);
  let clientId: string | null = null;

  // 1. Try to get client ID from authenticated session
  if (session?.user?.id) {
    const client = await prisma.client.findUnique({
      where: { authId: session.user.id },
      select: { id: true },
    });
    if (client) {
      clientId = client.id;
    }
  }

  // 2. If not found via session, try to find by email in form data
  // Assuming contactInfo is Json and has an email field, e.g., [{ type: 'email', value: 'test@example.com', primary: true }]
  if (!clientId && formEmail) {
    const client = await prisma.client.findFirst({
      where: {
        contactInfo: {
          path: ["email", "value"], // Adjust path based on actual JSON structure
          string_contains: formEmail,
        },
      },
      select: { id: true },
    });
    if (client) {
      clientId = client.id;
    }
  }
  return clientId;
}

export async function submitForm(
  formId: string,
  formData: ClientNotePayload,
  submissionType: SubmissionType,
  formUniqueName?: string
): Promise<SubmissionResult> {
  try {
    const formEmail = formData.find((field) => field.name === "email")
      ?.value as string | undefined;
    const clientId = await getClientId(formEmail);

    // Check for existing submission
    const existingSubmission = await prisma.clientNote.findFirst({
      where: {
        formId: formId,
        clientId: clientId, // Can be null, which is fine for findFirst
      },
    });

    switch (submissionType) {
      case "SubmitOnce":
        if (existingSubmission) {
          return {
            success: false,
            error: "You have already submitted this form.",
            code: "ALREADY_SUBMITTED",
          };
        }
        break; // Proceed to create
      case "AllowUpdate":
        if (existingSubmission) {
          // Signal to client that an update is needed, returning the existing submission's ID
          return {
            success: false,
            error: "An existing submission was found.",
            code: "EXISTING_FOUND",
            existingSubmissionId: existingSubmission.id,
          };
        }
        break; // Proceed to create
      case "AllowMultiple":
        // Always create a new one, no checks needed
        break;
    }

    // Create new submission
    const newSubmission = await prisma.clientNote.create({
      data: {
        formId: formId,
        formData: formData,
        formUniqueName: formUniqueName,
        client: clientId ? { connect: { id: clientId } } : undefined,
        noteType: "ClientForm",
        noteMetadata: {
          noteType: "Client Form",
          formId: formId,
          formUniqueName: formUniqueName,
        },
      },
    });

    return {
      success: true,
      message: "Form submitted successfully!",
      submission: newSubmission,
    };
  } catch (error: any) {
    console.error("Error submitting form:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function updateForm(
  submissionId: string,
  formData: ClientNotePayload
): Promise<SubmissionResult> {
  try {
    const updatedSubmission = await prisma.clientNote.update({
      where: { id: submissionId },
      data: {
        formData: formData,
        updatedAt: new Date(),
      },
    });
    return {
      success: true,
      message: "Form updated successfully!",
      submission: updatedSubmission,
    };
  } catch (error: any) {
    console.error("Error updating form:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

export async function getClientNotes(
  clientId: string
): Promise<{ success: boolean; submissions?: any[]; error?: string }> {
  try {
    const submissions = await prisma.clientNote.findMany({
      where: { clientId: clientId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, submissions };
  } catch (error: any) {
    console.error("Error fetching form submissions:", error);
    return { success: false, error: error.message };
  }
}

export async function getClientNote(
  submissionId: string
): Promise<{ success: boolean; submission?: any; error?: string }> {
  try {
    const submission = await prisma.clientNote.findUnique({
      where: { id: submissionId },
    });
    if (!submission) {
      return { success: false, error: "Submission not found." };
    }
    return { success: true, submission };
  } catch (error: any) {
    console.error("Error fetching form submission:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteClientNote(
  submissionId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await prisma.clientNote.delete({
      where: { id: submissionId },
    });
    return { success: true, message: "Submission deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting form submission:", error);
    return { success: false, error: error.message };
  }
}
