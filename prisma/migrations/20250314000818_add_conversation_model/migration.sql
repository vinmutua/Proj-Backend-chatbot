/*
  Warnings:

  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_userId_fkey";

-- DropTable
DROP TABLE "conversations";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
