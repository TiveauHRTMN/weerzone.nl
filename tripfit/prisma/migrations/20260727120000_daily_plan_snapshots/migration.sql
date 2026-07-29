CREATE TABLE "daily_plan_snapshots" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "planDate" DATE NOT NULL,
  "weatherRevision" TEXT NOT NULL,
  "profileRevision" TEXT NOT NULL,
  "rankingVersion" TEXT NOT NULL,
  "weatherSource" TEXT NOT NULL,
  "weatherFallback" TEXT NOT NULL,
  "weatherRetrievedAt" TIMESTAMP(3) NOT NULL,
  "plan" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_plan_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "daily_plan_snapshots_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "daily_plan_snapshots_cache_key"
  ON "daily_plan_snapshots"(
    "tripId", "planDate", "weatherRevision", "profileRevision", "rankingVersion"
  );
CREATE INDEX "daily_plan_snapshots_tripId_planDate_createdAt_idx"
  ON "daily_plan_snapshots"("tripId", "planDate", "createdAt");

ALTER TABLE "daily_plan_snapshots" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_plan_snapshots_owner_read"
  ON "daily_plan_snapshots" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "trips" t
      WHERE t.id = "tripId" AND t."userId" = auth.uid()
    )
  );
