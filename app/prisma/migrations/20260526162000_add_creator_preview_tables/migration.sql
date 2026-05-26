CREATE TABLE IF NOT EXISTS "CreatorPreviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "personImageUrl" TEXT NOT NULL,
    "sourceImageUrl" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "directionTags" JSONB NOT NULL,
    "selectedOuterwearId" TEXT,
    "selectedInnerwearId" TEXT,
    "selectedPantsId" TEXT,
    "selectedAccessoryId" TEXT,
    "selectedShoesId" TEXT,
    "selectedDirection" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatorPreviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CreatorPreviewSession_userId_createdAt_idx"
ON "CreatorPreviewSession"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "CreatorPreviewVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "resultUrl" TEXT NOT NULL,
    "presentationTone" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreatorPreviewVariant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CreatorPreviewSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CreatorPreviewVariant_sessionId_sortOrder_idx"
ON "CreatorPreviewVariant"("sessionId", "sortOrder");

CREATE UNIQUE INDEX IF NOT EXISTS "CreatorPreviewVariant_sessionId_direction_key"
ON "CreatorPreviewVariant"("sessionId", "direction");
