"use server";

import prisma from "@/utils/prisma/client";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface PromptData {
  id: string;
  title: string;
  prompt: string;
  current: boolean;
  type: "Trainer";
}

// Helper to check authorization
async function checkAuthorization() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !session.user ||
    !session.user.roles ||
    !session.user.roles.some((role) =>
      ([UserRole.SystemAdmin, UserRole.Admin] as UserRole[]).includes(role)
    )
  ) {
    throw new Error("Unauthorized");
  }
}

export async function fetchPrompts(): Promise<PromptData[]> {
  await checkAuthorization();
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: { title: "asc" },
    });
    return prompts;
  } catch (error) {
    console.error("Error fetching prompts:", error);
    throw new Error("Failed to fetch prompts.");
  }
}

export async function createPrompt(data: Omit<PromptData, "id">): Promise<PromptData> {
  await checkAuthorization();
  try {
    const newPrompt = await prisma.prompt.create({ data });
    return newPrompt;
  } catch (error) {
    console.error("Error creating prompt:", error);
    throw new Error("Failed to create prompt.");
  }
}

export async function updatePrompt(id: string, data: Partial<PromptData>): Promise<PromptData> {
  await checkAuthorization();
  try {
    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data,
    });
    return updatedPrompt;
  } catch (error) {
    console.error("Error updating prompt:", error);
    throw new Error("Failed to update prompt.");
  }
}

export async function deletePrompt(id: string): Promise<void> {
  await checkAuthorization();
  try {
    await prisma.prompt.delete({ where: { id } });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    throw new Error("Failed to delete prompt.");
  }
}
