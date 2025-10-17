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
