import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
export function database() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  for (const f of readdirSync("migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    db.exec(readFileSync("migrations/" + f, "utf8"));
  const prepare = (sql: string, args: any[] = []) => ({
    bind(...a: any[]) {
      return prepare(sql, a);
    },
    async first(column?: string) {
      const r = db.prepare(sql).get(...args);
      return r ? (column ? r[column] : { ...r }) : null;
    },
    async all() {
      return {
        success: true,
        results: db
          .prepare(sql)
          .all(...args)
          .map((r) => ({ ...r })),
        meta: {},
      };
    },
    async run() {
      const r = db.prepare(sql).run(...args);
      return {
        success: true,
        results: [],
        meta: {
          changes: Number(r.changes),
          last_row_id: Number(r.lastInsertRowid),
        },
      };
    },
    _run() {
      const p = db.prepare(sql);
      if (/^\s*(SELECT|.*RETURNING)/is.test(sql))
        return {
          success: true,
          results: p.all(...args).map((r) => ({ ...r })),
          meta: { changes: 0 },
        };
      const r = p.run(...args);
      return {
        success: true,
        results: [],
        meta: { changes: Number(r.changes) },
      };
    },
  });
  return {
    prepare,
    async batch(statements: any[]) {
      db.exec("BEGIN");
      try {
        const result = statements.map((s) => s._run());
        db.exec("COMMIT");
        return result;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
    db,
    close() {
      db.close();
    },
  } as unknown as D1Database & { db: DatabaseSync; close: () => void };
}
export function bucket() {
  const map = new Map<string, Uint8Array>();
  return {
    async put(k: string, v: any) {
      const bytes = await new Response(v).arrayBuffer();
      map.set(k, new Uint8Array(bytes));
    },
    async get(k: string) {
      const data = map.get(k);
      return data
        ? { body: new Response(data.buffer as ArrayBuffer).body }
        : null;
    },
    async delete(keys: string | string[]) {
      for (const k of Array.isArray(keys) ? keys : [keys]) map.delete(k);
    },
  } as unknown as R2Bucket;
}
