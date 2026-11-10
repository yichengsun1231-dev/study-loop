import { Env, Problem, Row, id, now, str } from "./types";
export const stmt = (db: D1Database, sql: string, ...args: any[]) =>
  db.prepare(sql).bind(...args);
export const all = async (db: D1Database, sql: string, ...args: any[]) =>
  (await stmt(db, sql, ...args).all<Row>()).results;
export const one = async (db: D1Database, sql: string, ...args: any[]) =>
  stmt(db, sql, ...args).first<Row>();
export const run = async (db: D1Database, sql: string, ...args: any[]) =>
  stmt(db, sql, ...args).run();
export async function owned(
  db: D1Database,
  table: string,
  resourceId: string,
  user: string,
) {
  if (
    ![
      "goals",
      "tasks",
      "attempts",
      "files",
      "evidence",
      "portfolio",
      "suggestions",
      "jobs",
      "evaluations",
      "projects",
    ].includes(table)
  )
    throw new Error("Invalid table");
  const row = await one(
    db,
    `SELECT * FROM ${table} WHERE id=? AND user_id=?`,
    resourceId,
    user,
  );
  if (!row) throw new Problem(404, "NOT_FOUND", "This record is unavailable.");
  return row;
}
export const insert = (db: D1Database, table: string, data: Row) =>
  stmt(
    db,
    `INSERT INTO ${table} (${Object.keys(data).join(",")}) VALUES (${Object.keys(
      data,
    )
      .map(() => "?")
      .join(",")})`,
    ...Object.values(data),
  );
export const event = (
  db: D1Database,
  user: string,
  goal: string | null,
  kind: string,
  data: unknown,
) =>
  insert(db, "events", {
    id: id(),
    user_id: user,
    goal_id: goal,
    kind,
    data: str(data),
    created_at: now(),
  });
export async function ensurePlans(db: D1Database) {
  await db.batch([
    stmt(
      db,
      "INSERT OR IGNORE INTO plans (id,name,ai_limit,storage_limit,goal_limit,enabled,features) VALUES ('free','Explorer',30,26214400,3,1,?)",
      str([
        "3 active goals",
        "30 AI actions / month",
        "Private learning portfolio",
      ]),
    ),
    stmt(
      db,
      "INSERT OR IGNORE INTO plans (id,name,ai_limit,storage_limit,goal_limit,enabled,features) VALUES ('pro','Builder',300,262144000,20,1,?)",
      str([
        "20 active goals",
        "300 AI actions / month",
        "More room for your projects",
      ]),
    ),
  ]);
}
export async function entitlement(db: D1Database, user: string) {
  await ensurePlans(db);
  const subscription = await one(
    db,
    "SELECT * FROM subscriptions WHERE user_id=?",
    user,
  );
  const active =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    subscription.period_end > Date.now() / 1000;
  const plan =
    (await one(
      db,
      "SELECT * FROM plans WHERE id=? AND enabled=1",
      active ? "pro" : "free",
    )) || (await one(db, "SELECT * FROM plans WHERE id='free'"));
  const month = now().slice(0, 7);
  await run(
    db,
    "INSERT OR IGNORE INTO monthly_usage (id,user_id,month) VALUES (?,?,?)",
    `${user}:${month}`,
    user,
    month,
  );
  const usage = await one(
    db,
    "SELECT * FROM monthly_usage WHERE user_id=? AND month=?",
    user,
    month,
  );
  const storage = await one(
    db,
    "SELECT COALESCE(SUM(size),0) AS bytes FROM files WHERE user_id=?",
    user,
  );
  return {
    plan: plan!,
    subscription,
    usage: usage!,
    storageBytes: storage?.bytes || 0,
  };
}
export async function releaseJob(
  db: D1Database,
  job: Row,
  status: string,
  error: string,
) {
  await db.batch([
    stmt(
      db,
      "UPDATE monthly_usage SET reserved=MAX(0,reserved-1) WHERE user_id=? AND month=? AND EXISTS(SELECT 1 FROM jobs WHERE id=? AND reserved=1)",
      job.user_id,
      job.usage_month,
      job.id,
    ),
    stmt(
      db,
      "UPDATE jobs SET status=?,error=?,reserved=0,updated_at=? WHERE id=? AND status='running'",
      status,
      error,
      now(),
      job.id,
    ),
  ]);
}
export function isAdmin(env: Env, user: string) {
  return (env.ADMIN_USER_IDS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .includes(user);
}
