"use server";

import { getPrismaSchemaContext as getPrismaSchemaContextUtil } from "@/utils/ai/vercel/toolManager/tools/db/prisma";

export async function getPrismaSchemaContext() {
  return getPrismaSchemaContextUtil();
}
