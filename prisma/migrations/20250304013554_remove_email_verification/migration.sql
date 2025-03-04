/*
  Warnings:

  - You are about to drop the column `isVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordExpires` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "isVerified",
DROP COLUMN "resetPasswordExpires",
DROP COLUMN "resetPasswordToken",
DROP COLUMN "verificationToken";
