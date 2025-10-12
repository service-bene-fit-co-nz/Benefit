/*
  Warnings:

  - You are about to drop the `ClientNotes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientNotes" DROP CONSTRAINT "ClientNotes_clientId_fkey";

-- DropTable
DROP TABLE "public"."ClientNotes";

-- CreateTable
CREATE TABLE "public"."ClientNote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "clientId" TEXT,
    "formUniqueName" TEXT,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ClientNote" ADD CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
