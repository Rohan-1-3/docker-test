/*
  Warnings:

  - You are about to drop the column `path` on the `photos` table. All the data in the column will be lost.
  - Added the required column `data` to the `photos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."photos" DROP COLUMN "path",
ADD COLUMN     "data" BYTEA NOT NULL;
