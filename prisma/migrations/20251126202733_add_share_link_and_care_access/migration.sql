-- CreateEnum
CREATE TYPE "ShareLinkStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" VARCHAR(32) NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "ownerId" VARCHAR(32) NOT NULL,
    "viewerId" VARCHAR(32),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "ShareLinkStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareAccess" (
    "id" VARCHAR(32) NOT NULL,
    "ownerId" VARCHAR(32) NOT NULL,
    "viewerId" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_token_idx" ON "ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_ownerId_idx" ON "ShareLink"("ownerId");

-- CreateIndex
CREATE INDEX "ShareLink_status_expiresAt_idx" ON "ShareLink"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "CareAccess_ownerId_idx" ON "CareAccess"("ownerId");

-- CreateIndex
CREATE INDEX "CareAccess_viewerId_idx" ON "CareAccess"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "CareAccess_ownerId_viewerId_key" ON "CareAccess"("ownerId", "viewerId");

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAccess" ADD CONSTRAINT "CareAccess_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareAccess" ADD CONSTRAINT "CareAccess_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
