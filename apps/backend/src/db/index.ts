/// <reference types="@cloudflare/workers-types" />

import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"

let _db: ReturnType<typeof drizzle>

export function initDb(binding: D1Database) {
  _db ||= drizzle(binding, { schema })
  return _db
}

export function getDb() {
  if (!_db) throw new Error("DB not initialized")
  return _db
}
