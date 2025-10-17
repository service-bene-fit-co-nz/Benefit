// src/server-actions/client/notes/actions.ts
"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, UserRole, ClientNoteType } from "@prisma/client";

export interface ClientNote {
  id: string;
  noteMetadata: Prisma.JsonValue;
  formData: Prisma.JsonValue;
  updatedAt: Date;
  noteType: ClientNoteType;
}

export async function fetchClientNotes(
  clientId: string,
  noteTypes: ClientNoteType[] | undefined = undefined
): Promise<ClientNote[]> {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.roles ||
    !session.user.roles.some((role) =>
      (
        [UserRole.SystemAdmin, UserRole.Admin, UserRole.Trainer] as UserRole[]
      ).includes(role)
    )
  ) {
    throw new Error("Unauthorized");
  }

  if (!clientId) {
    return [];
  }

  const where: Prisma.ClientNoteWhereInput = {
    clientId: clientId,
  };

  if (noteTypes && noteTypes.length > 0) {
    where.noteType = { in: noteTypes };
  }

  try {
    const clientNotes = await prisma.clientNote.findMany({
      where: where,
      select: {
        id: true,
        formData: true,
        noteMetadata: true,
        updatedAt: true,
        noteType: true,
      },
    });

    return clientNotes;
  } catch (error) {
    console.error(
      `Error fetching client forms for client ID ${clientId}:`,
      error
    );
    throw new Error("Failed to fetch client forms.");
  }
}

export async function createClientNote(
  clientId: string,
  noteContent: string,
  noteType: ClientNoteType,
  noteMetadata: Prisma.InputJsonValue
): Promise<ClientNote> {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.roles ||
    !session.user.roles.some((role) =>
      ([UserRole.SystemAdmin, UserRole.Admin, UserRole.Trainer] as UserRole[]).includes(
        role
      )
    )
  ) {
    throw new Error("Unauthorized");
  }

  if (!clientId || !noteContent || !noteType) {
    throw new Error("Client ID, note content, and note type are required.");
  }

  try {
    const newNote = await prisma.clientNote.create({
      data: {
        clientId: clientId,
        formData: { content: noteContent }, // Assuming formData stores the content
        noteMetadata: noteMetadata,
        noteType: noteType,
        formId: "manual-note-" + Date.now(), // A dummy formId for manual notes
      },
    });
    return newNote;
  } catch (error) {
    console.error(`Error creating client note for client ID ${clientId}:`, error);
    throw new Error("Failed to create client note.");
  }
}

export async function deleteClientNote(noteId: string): Promise<void> {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.roles ||
    !session.user.roles.some((role) =>
      ([UserRole.SystemAdmin, UserRole.Admin, UserRole.Trainer] as UserRole[]).includes(
        role
      )
    )
  ) {
    throw new Error("Unauthorized");
  }

  if (!noteId) {
    throw new Error("Note ID is required.");
  }

  try {
    await prisma.clientNote.delete({
      where: { id: noteId },
    });
  } catch (error) {
    console.error(`Error deleting client note with ID ${noteId}:`, error);
    throw new Error("Failed to delete client note.");
  }
}
