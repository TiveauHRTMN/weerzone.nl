import "dotenv/config";
import { defineConfig } from "prisma/config";

import { parseDatabaseUrl } from "./src/config/database-url";

const migrationUrl = parseDatabaseUrl(
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL,
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // `generate` and `validate` work without a database. Migration commands fail
  // closed until a valid PostgreSQL URL is explicitly configured.
  datasource: migrationUrl ? { url: migrationUrl } : undefined,
});
