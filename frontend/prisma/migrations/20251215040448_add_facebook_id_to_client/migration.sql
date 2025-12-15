/*
  Warnings:

  - A unique constraint covering the columns `[facebookId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "facebookId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_facebookId_key" ON "public"."Client"("facebookId");
