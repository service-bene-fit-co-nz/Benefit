// src/server-actions/client/notes/actions.ts
"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, UserRole } from "@prisma/client"; // Added Prisma

export interface ClientForm {
  id: string;
  formUniqueName: string;
  noteMetadata: Prisma.JsonValue;
  updatedAt: Date; // Added updatedAt
}

export async function fetchClientForms(
  clientId: string
): Promise<ClientForm[]> {
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

  if (!clientId) {
    return [];
  }

  try {
    const clientNotes = await prisma.clientNote.findMany({
      where: {
        clientId: clientId,
        noteType: "ClientForm",
      },
      select: {
        id: true,
        formUniqueName: true,
        noteMetadata: true,
        updatedAt: true, // Added updatedAt
      },
    });

    return clientNotes.map((note) => ({
      id: note.id,
      formUniqueName: note.formUniqueName || "Unnamed Form", // Provide a fallback
      noteMetadata: note.noteMetadata,
      updatedAt: note.updatedAt, // Mapped updatedAt
    }));
  } catch (error) {
    console.error(`Error fetching client forms for client ID ${clientId}:`, error);
    throw new Error("Failed to fetch client forms.");
  }
}
