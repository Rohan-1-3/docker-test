/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `photos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "photos_userId_key" ON "public"."photos"("userId");
