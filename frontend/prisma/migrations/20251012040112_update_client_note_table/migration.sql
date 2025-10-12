/*
  Warnings:

  - Added the required column `noteMetadata` to the `ClientNote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ClientNoteType" AS ENUM ('AINote', 'TrainerNote', 'ClientEmail', 'ClientForm', 'ClientNote', 'FitnessTrackerEntry', 'HabitEntry');

-- AlterTable
ALTER TABLE "public"."ClientNote" ADD COLUMN     "noteMetadata" JSONB NOT NULL,
ADD COLUMN     "noteType" "public"."ClientNoteType" NOT NULL DEFAULT 'TrainerNote';
