"use server";

import prisma from "@/utils/prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, Prisma } from "@prisma/client";
import { ActionResult } from "@/types/server-action-results";

export interface Contact {
  type: string;
  value: string;
  primary?: boolean;
}

export interface ClientDetails {
  id: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  facebookId?: string;
  contacts: Contact[];
}

export interface ClientForTrainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  gender?: string;
  settings?: Prisma.JsonValue;
  facebook?: string;
}

export async function fetchClientsForTrainer(
  query?: string,
  programmeId?: string
): Promise<ClientForTrainer[]> {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.roles || // Ensure roles array exists
    !session.user.roles.some((role) =>
      (
        [UserRole.SystemAdmin, UserRole.Admin, UserRole.Trainer] as UserRole[]
      ).includes(role)
    )
  ) {
    throw new Error("Unauthorized");
  }

  try {
    let whereClause: any = {};

    if (programmeId) {
      const enrolments = await prisma.programmeEnrolment.findMany({
        where: { programId: programmeId },
        select: { clientId: true },
      });
      const clientIds = enrolments.map((e) => e.clientId);
      whereClause.id = { in: clientIds };
    }

    if (query) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          email: { contains: query, mode: "insensitive" },
        },
        select: { id: true },
      });

      const matchingUserAuthIds = matchingUsers.map((user) => user.id);

      whereClause.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ];

      if (matchingUserAuthIds.length > 0) {
        whereClause.OR.push({ authId: { in: matchingUserAuthIds } });
      } else if (
        !whereClause.OR[0].firstName.contains &&
        !whereClause.OR[1].lastName.contains
      ) {
        whereClause.id = "";
      }
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        avatarUrl: true,
        contactInfo: true,
        authId: true,
        gender: true,
        settings: true,
        facebookId: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    const clientsWithEmails = await Promise.all(
      clients.map(async (client) => {
        let userEmail = "N/A";
        let phone: string | undefined;
        try {
          const user = await prisma.user.findUnique({
            where: { id: client.authId },
            select: { email: true },
          });
          userEmail = user?.email || "N/A";
          if (Array.isArray(client.contactInfo)) {
            const primaryPhone = client.contactInfo.find(
              (info) =>
                (info as any).type === "phone" && (info as any).primary === true
            );
            if (primaryPhone) {
              phone = (primaryPhone as any).value;
            }
          } else if (
            typeof client.contactInfo === "object" &&
            client.contactInfo !== null
          ) {
            if (
              (client.contactInfo as any).type === "phone" &&
              (client.contactInfo as any).primary === true
            ) {
              phone = (client.contactInfo as any).value;
            } else if ((client.contactInfo as any).phone) {
              phone = (client.contactInfo as any).phone;
            }
          }
        } catch (error) {
          console.error(
            `Error fetching user/contact info for client ID ${client.id} (authId: ${client.authId}):`,
            error
          );
          userEmail = "Error fetching email";
        }

        const fullName = [client.firstName, client.lastName]
          .filter(Boolean)
          .join(" ");

        return {
          id: client.id,
          name: fullName,
          email: userEmail,
          phone: phone || undefined,
          dateOfBirth: client.birthDate?.toISOString().split("T")[0],
          avatarUrl: client.avatarUrl || undefined,
          gender: client.gender || undefined,
          settings: client.settings || undefined,
          facebook: client.facebookId || undefined,
        };
      })
    );

    return clientsWithEmails;
  } catch (error) {
    console.error("Error fetching clients for trainer at top level:", error);
    throw new Error("Failed to fetch clients.");
  }
}

export async function fetchClientById(
  clientId: string
): Promise<ClientForTrainer | null> {
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
    return null;
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        avatarUrl: true,
        contactInfo: true,
        authId: true,
        gender: true,
        settings: true,
        facebookId: true,
      },
    });

    if (!client) {
      return null;
    }

    let userEmail = "N/A";
    let phone: string | undefined;
    try {
      const user = await prisma.user.findUnique({
        where: { id: client.authId },
        select: { email: true },
      });
      userEmail = user?.email || "N/A";
      if (Array.isArray(client.contactInfo)) {
        const primaryPhone = client.contactInfo.find(
          (info) =>
            (info as any).type === "phone" && (info as any).primary === true
        );
        if (primaryPhone) {
          phone = (primaryPhone as any).value;
        }
      } else if (
        typeof client.contactInfo === "object" &&
        client.contactInfo !== null
      ) {
        if (
          (client.contactInfo as any).type === "phone" &&
          (client.contactInfo as any).primary === true
        ) {
          phone = (client.contactInfo as any).value;
        } else if ((client.contactInfo as any).phone) {
          phone = (client.contactInfo as any).phone;
        }
      }
    } catch (error) {
      console.error(
        `Error fetching user/contact info for client ID ${client.id} (authId: ${client.authId}):`,
        error
      );
      userEmail = "Error fetching email";
    }

    const fullName = [client.firstName, client.lastName]
      .filter(Boolean)
      .join(" ");

    return {
      id: client.id,
      name: fullName,
      email: userEmail,
      phone: phone || undefined,
      dateOfBirth: client.birthDate?.toISOString().split("T")[0],
      avatarUrl: client.avatarUrl || undefined,
      gender: client.gender || undefined,
      settings: client.settings || undefined,
      facebook: client.facebookId || undefined,
    };
  } catch (error) {
    console.error(`Error fetching client by ID ${clientId}:`, error);
    throw new Error("Failed to fetch client details.");
  }
}

export async function fetchClients(params: {
  clientId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}): Promise<ActionResult<ClientDetails[]>> {
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
    return { success: false, message: "Unauthorized" };
  }

  const { clientId, email, firstName, lastName } = params;

  try {
    let whereClause: Prisma.ClientWhereInput = {};

    if (clientId) {
      whereClause = { id: clientId };
    } else if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (user) {
        whereClause = { authId: user.id };
      } else {
        return { success: true, data: [] }; // No user found with that email, so no clients
      }
    } else if (firstName || lastName) {
      whereClause = {
        AND: [
          firstName
            ? { firstName: { contains: firstName, mode: "insensitive" } }
            : {},

          lastName
            ? { lastName: { contains: lastName, mode: "insensitive" } }
            : {},
        ],
      };
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        facebookId: true,
        contactInfo: true, // Include contactInfo for the new type
      },

      orderBy: {
        firstName: "asc",
      },
    });

    const clientDetailsList: ClientDetails[] = clients.map((client) => {
      const contacts: Contact[] = [];

      if (client.contactInfo) {
        if (Array.isArray(client.contactInfo)) {
          for (const info of client.contactInfo) {
            if (
              typeof info === "object" &&
              info !== null &&
              "type" in info &&
              "value" in info
            ) {
              contacts.push({
                type: (info as any).type,
                value: (info as any).value,
                primary: (info as any).primary,
              });
            }
          }
        } else if (
          typeof client.contactInfo === "object" &&
          client.contactInfo !== null
        ) {
          if ("type" in client.contactInfo && "value" in client.contactInfo) {
            contacts.push({
              type: (client.contactInfo as any).type,
              value: (client.contactInfo as any).value,
              primary: (client.contactInfo as any).primary,
            });
          }
        }
      }

      return {
        id: client.id,
        firstName: client.firstName || undefined,
        lastName: client.lastName || undefined,
        dateOfBirth: client.birthDate?.toISOString().split("T")[0],
        gender: client.gender || undefined,
        facebookId: client.facebookId || undefined,
        contacts: contacts,
      };
    });

    return { success: true, data: clientDetailsList };
  } catch (error) {
    console.error("Error in fetchClients:", error);

    if (error instanceof Error) {
      return { success: false, message: error.message };
    }

    return { success: false, message: "An unknown error occurred." };
  }
}
