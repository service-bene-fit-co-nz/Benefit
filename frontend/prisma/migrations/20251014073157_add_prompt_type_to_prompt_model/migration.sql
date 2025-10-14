-- CreateEnum
CREATE TYPE "public"."PromptType" AS ENUM ('Trainer');

-- CreateTable
CREATE TABLE "public"."Prompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "type" "public"."PromptType" NOT NULL DEFAULT 'Trainer',

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);
