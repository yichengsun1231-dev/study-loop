import { Hono } from "hono";
import { z, ZodError } from "zod";
import { secureHeaders } from "hono/secure-headers";
import { AppEnv, Problem, id, now, parse, str, Row } from "./types";
import {
  all,
  one,
  run,
  stmt,
  insert,
  event,
  owned,
  entitlement,
  isAdmin,
} from "./db";
import { goalDetails, defaultDetails, mapSchema, taskSpec } from "./contracts";
import {
  goalBundle,
  unlocked,
  mapStatements,
  taskStatements,
} from "./learning";
import { aiRoute, cancelJob, recoverJobs } from "./ai";
import { checkout, portal, webhook } from "./billing";
import { launchDemo } from "./demos";
import { starters } from "../shared/starters";
const app = new Hono<AppEnv>();
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://127.0.0.1:8765"],
      frameAncestors: [
        "'self'",
        "https://chatgpt.com",
        "https://*.chatgpt.com",
      ],
    },
    referrerPolicy: "strict-origin-when-cross-origin",
  }),
);
app.use("/api/*", async (c, next) => {
  const requestId = id();
  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);
  c.header("Cache-Control", "no-store");
  const size = Number(c.req.header("content-length") || 0);
  if (size > 6 * 1024 * 1024)
    throw new Problem(413, "TOO_LARGE", "Please keep each upload below 5 MB.");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(c.req.method) &&
    c.req.path !== "/api/billing/webhook"
  ) {
    const origin = c.req.header("origin");
    if (origin && origin !== new URL(c.req.url).origin)
      throw new Problem(
        403,
        "ORIGIN_MISMATCH",
        "Cross-origin changes are not allowed.",
      );
  }
  await next();
});
app.get("/health", async (c) => {
  try {
    await one(c.env.DB, "SELECT 1 AS ok");
    return c.json({ status: "ok", version: "0.1.0", storage: !!c.env.BUCKET });
  } catch {
    return c.json({ status: "degraded", database: "unavailable" }, 503);
  }
});
app.post("/api/billing/webhook", webhook);
app.get("/api/shared/:token", async (c) => {
  const p = await one(
    c.env.DB,
    "SELECT p.title,p.created_at,a.content,a.explanation,a.version,a.assistance,e.result FROM portfolio p JOIN attempts a ON a.id=p.attempt_id LEFT JOIN evaluations e ON e.id=p.evaluation_id WHERE p.share_token=? AND p.visibility='shared'",
    c.req.param("token"),
  );
  if (!p)
    throw new Problem(404, "NOT_FOUND", "This shared project is unavailable.");
  return c.json({
    project: p,
    notice: "Kleos internal assessment; not an external certification.",
  });
});
app.use("/api/*", async (c, next) => {
  let userId = c.req.header("oai-authenticated-user-id"),
    email = c.req.header("oai-authenticated-user-email") || "",
    name = c.req.header("oai-authenticated-user-full-name") || "";
  if (
    c.req.header("oai-authenticated-user-full-name-encoding") ===
    "percent-encoded-utf-8"
  ) {
    try {
      name = decodeURIComponent(name);
    } catch {
      name = "";
    }
  }
  // The compile-time development branch is removed from production builds.
  if (import.meta.env.DEV && c.env.DEV_AUTH === "true" && !userId) {
    userId = "local-development-learner";
    email = "learner@localhost";
    name = "Learner";
  }
  if (!userId)
    throw new Problem(
      401,
      "SIGN_IN_REQUIRED",
      "Sign in to keep your learning journey with you.",
    );
  const existing = await one(
    c.env.DB,
    "SELECT deleted_at FROM users WHERE id=?",
    userId,
  );
  if (existing?.deleted_at)
    throw new Problem(
      410,
      "ACCOUNT_DELETED",
      "Learning data for this account has been deleted.",
    );
  if (!existing)
    await run(
      c.env.DB,
      "INSERT OR IGNORE INTO users (id,email,name,settings,created_at) VALUES (?,?,?,?,?)",
      userId,
      email,
      name || email.split("@")[0] || "Learner",
      "{}",
      now(),
    );
  c.set("actor", {
    id: userId,
    email,
    name: name || email.split("@")[0] || "Learner",
  });
  await next();
});
app.get("/api/bootstrap", async (c) => {
  const actor = c.get("actor"),
    db = c.env.DB;
  await recoverJobs(db, actor.id);
  const [user, goals, access, activity, portfolio, feedback] =
    await Promise.all([
      one(
        db,
        "SELECT id,email,name,settings,created_at FROM users WHERE id=?",
        actor.id,
      ),
      all(
        db,
        "SELECT * FROM goals WHERE user_id=? ORDER BY updated_at DESC",
        actor.id,
      ),
      entitlement(db, actor.id),
      all(
        db,
        "SELECT * FROM events WHERE user_id=? ORDER BY created_at DESC LIMIT 30",
        actor.id,
      ),
      all(
        db,
        "SELECT p.*,a.version,a.assistance,e.result FROM portfolio p JOIN attempts a ON a.id=p.attempt_id LEFT JOIN evaluations e ON e.id=p.evaluation_id WHERE p.user_id=? ORDER BY p.created_at DESC",
        actor.id,
      ),
      all(
        db,
        "SELECT * FROM feedback WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
        actor.id,
      ),
    ]);
  const stats = await one(
    db,
    "SELECT (SELECT COUNT(*) FROM attempts a JOIN tasks t ON t.id=a.task_id JOIN goals g ON g.id=t.goal_id WHERE a.user_id=? AND a.status='submitted' AND COALESCE(json_extract(g.details,'$.is_demo'),0)=0) AS submissions,(SELECT COUNT(*) FROM evidence WHERE user_id=? AND independent=1 AND valid=1) AS independent_evidence,(SELECT COUNT(*) FROM skills s WHERE s.user_id=? AND s.status='verified' AND s.path_id=(SELECT id FROM paths WHERE goal_id=s.goal_id ORDER BY created_at DESC LIMIT 1)) AS verified_skills",
    actor.id,
    actor.id,
    actor.id,
  );
  return c.json({
    user,
    goals,
    access,
    activity,
    portfolio,
    feedback,
    stats,
    services: {
      ai: !!c.env.OPENAI_API_KEY,
      billing: !!(
        c.env.STRIPE_SECRET_KEY &&
        c.env.STRIPE_PRO_PRICE_ID &&
        c.env.STRIPE_WEBHOOK_SECRET
      ),
      billingMode: c.env.BILLING_MODE || "test",
      files: !!c.env.BUCKET,
      execution: false,
    },
    admin: isAdmin(c.env, actor.id),
  });
});
const createGoal = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(3).max(5000),
  details: goalDetails.optional(),
  entryType: z.enum(["direction", "project", "skill"]).default("skill"),
  starterId: z.string().optional(),
});
app.post("/api/demos/:id", launchDemo);
app.post("/api/goals", async (c) => {
  const body = createGoal.parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    access = await entitlement(db, actor.id);
  const count = await one(
    db,
    "SELECT COUNT(*) AS n FROM goals WHERE user_id=? AND status='active' AND COALESCE(json_extract(details,'$.is_demo'),0)=0",
    actor.id,
  );
  if (count!.n >= access.plan.goal_limit)
    throw new Problem(
      429,
      "GOAL_LIMIT",
      "Pause a goal to make room for a new one, or review your plan.",
    );
  const goalId = id(),
    time = now();
  await db.batch([
    insert(db, "goals", {
      id: goalId,
      user_id: actor.id,
      title: body.title,
      description: body.description,
      details: str({
        ...defaultDetails,
        ...body.details,
        starter_id: body.starterId || null,
        entry_type: body.entryType,
      }),
      status: "active",
      stage: "discover",
      confirmed: 0,
      version: 1,
      created_at: time,
      updated_at: time,
    }),
    event(db, actor.id, goalId, "goal_created", { title: body.title }),
  ]);
  return c.json(
    { id: goalId, message: "A small beginning. A real direction." },
    201,
  );
});
app.get("/api/goals/:id", async (c) =>
  c.json(await goalBundle(c.env.DB, c.get("actor").id, c.req.param("id"))),
);
app.patch("/api/goals/:id", async (c) => {
  const body = z
    .object({
      version: z.number().int(),
      title: z.string().min(3).max(160).optional(),
      description: z.string().min(3).max(5000).optional(),
      details: goalDetails.optional(),
      confirmed: z.boolean().optional(),
      status: z.enum(["active", "paused", "archived"]).optional(),
    })
    .parse(await c.req.json());
  const actor = c.get("actor"),
    db = c.env.DB,
    g = await owned(db, "goals", c.req.param("id"), actor.id);
  await unlocked(db, g.id);
  if (body.version !== g.version)
    throw new Problem(
      409,
      "VERSION_CONFLICT",
      "Your goal changed in another window. Reload before saving.",
    );
  if (body.status === "active" && g.status !== "active") {
    const access = await entitlement(db, actor.id);
    const count = await one(
      db,
      "SELECT COUNT(*) AS n FROM goals WHERE user_id=? AND status='active' AND COALESCE(json_extract(details,'$.is_demo'),0)=0",
      actor.id,
    );
    if (count!.n >= access.plan.goal_limit)
      throw new Problem(
        429,
        "GOAL_LIMIT",
        "Pause another goal before resuming this one.",
      );
  }
  const changed =
    (body.title && body.title !== g.title) ||
    (body.description && body.description !== g.description) ||
    body.details;
  const details = { ...parse(g.details), ...body.details };
  if (
    body.confirmed &&
    (!details.outcome?.trim() || !details.success_criteria?.length)
  )
    throw new Problem(
      400,
      "GOAL_DETAILS_REQUIRED",
      "Add an outcome and at least one observable success criterion.",
    );
  await db.batch([
    stmt(
      db,
      "UPDATE goals SET title=?,description=?,details=?,confirmed=?,status=?,stage=?,version=version+1,updated_at=? WHERE id=? AND user_id=? AND version=?",
      body.title || g.title,
      body.description || g.description,
      str(details),
      body.confirmed === undefined ? g.confirmed : body.confirmed ? 1 : 0,
      body.status || g.status,
      changed && g.confirmed ? "discover" : g.stage,
      now(),
      g.id,
      actor.id,
      g.version,
    ),
    event(
      db,
      actor.id,
      g.id,
      body.confirmed
        ? "goal_confirmed"
        : body.status === "paused"
          ? "goal_paused"
          : body.status === "active"
            ? "goal_resumed"
            : "goal_updated",
      {
        title: body.title || g.title,
        impact: changed
          ? "The goal changed. Review the path before the next task. Existing tasks and valid evidence are preserved."
          : "Status updated.",
      },
    ),
  ]);
  return c.json({
    ok: true,
    impact: changed
      ? "Review your path for this updated goal. Your previous work and valid evidence are preserved."
      : null,
  });
});
app.post("/api/goals/:id/projects", async (c) => {
  const body = z
      .object({
        title: z.string().min(3).max(200),
        outcome: z.string().min(3).max(4000),
      })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    g = await owned(c.env.DB, "goals", c.req.param("id"), actor.id),
    pid = id();
  await unlocked(c.env.DB, g.id);
  await insert(c.env.DB, "projects", {
    id: pid,
    user_id: actor.id,
    goal_id: g.id,
    title: body.title,
    outcome: body.outcome,
    status: "active",
    version: 1,
    created_at: now(),
  }).run();
  return c.json({ id: pid }, 201);
});
app.patch("/api/projects/:id", async (c) => {
  const body = z
      .object({
        title: z.string().min(3).max(200),
        outcome: z.string().min(3).max(4000),
        status: z.enum(["active", "complete", "paused"]),
        version: z.number().int(),
      })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    p = await owned(c.env.DB, "projects", c.req.param("id"), actor.id);
  await unlocked(c.env.DB, p.goal_id);
  if (p.version !== body.version)
    throw new Problem(
      409,
      "VERSION_CONFLICT",
      "Reload the project before saving.",
    );
  await run(
    c.env.DB,
    "UPDATE projects SET title=?,outcome=?,status=?,version=version+1 WHERE id=? AND user_id=? AND version=?",
    body.title,
    body.outcome,
    body.status,
    p.id,
    actor.id,
    body.version,
  );
  return c.json({ ok: true });
});
app.post("/api/goals/:id/map", async (c) => {
  const data = mapSchema.parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    g = await owned(db, "goals", c.req.param("id"), actor.id);
  await unlocked(db, g.id);
  if (!g.confirmed)
    throw new Problem(409, "CONFIRM_GOAL", "Confirm your goal first.");
  const m = mapStatements(db, actor.id, g, data, "Learner-authored path");
  await db.batch(m.writes);
  return c.json({ pathId: m.pathId }, 201);
});
app.post("/api/goals/:id/starter", async (c) => {
  const input = z.object({ starterId: z.string() }).parse(await c.req.json());
  const starter = starters.find((s) => s.id === input.starterId);
  if (!starter)
    throw new Problem(400, "INVALID_STARTER", "Choose an available starter.");
  const db = c.env.DB,
    actor = c.get("actor"),
    g = await owned(db, "goals", c.req.param("id"), actor.id);
  await unlocked(db, g.id);
  if (!g.confirmed)
    throw new Problem(409, "CONFIRM_GOAL", "Confirm your goal first.");
  const m = mapStatements(
    db,
    actor.id,
    g,
    {
      rationale:
        "You selected this curated starting path. Adapt it to your own goal; no ability has been assessed.",
      skills: [...starter.skills] as any,
    },
    "Curated Kleos starter selected by learner",
  );
  const task = taskStatements(
    db,
    actor.id,
    g,
    {
      task: starter.task,
      rationale: "A small, purposeful first project from your chosen starter.",
    },
    "project",
    starter.skills as any,
    [],
  );
  await db.batch([...m.writes, ...task.writes]);
  return c.json({ pathId: m.pathId, taskId: task.taskId }, 201);
});
app.post("/api/goals/:id/tasks", async (c) => {
  const data = z
    .object({
      task: taskSpec,
      projectId: z.string().uuid().optional(),
      rationale: z.string().min(1).max(4000),
      kind: z.enum(["project", "practice", "diagnostic"]).default("project"),
      parentId: z.string().uuid().optional(),
    })
    .parse(await c.req.json());
  const db = c.env.DB,
    actor = c.get("actor"),
    g = await owned(db, "goals", c.req.param("id"), actor.id);
  await unlocked(db, g.id);
  if (!g.confirmed)
    throw new Problem(409, "CONFIRM_GOAL", "Confirm your goal first.");
  const path = await one(
    db,
    "SELECT * FROM paths WHERE user_id=? AND goal_id=? ORDER BY created_at DESC LIMIT 1",
    actor.id,
    g.id,
  );
  const skills = path
    ? await all(
        db,
        "SELECT * FROM skills WHERE path_id=? AND user_id=?",
        path.id,
        actor.id,
      )
    : [];
  if (data.parentId) {
    const parent = await owned(db, "tasks", data.parentId, actor.id);
    if (parent.goal_id !== g.id)
      throw new Problem(400, "WRONG_GOAL", "Choose a task in this goal.");
  }
  let projectId = data.projectId;
  if (projectId) {
    const p = await owned(db, "projects", projectId, actor.id);
    if (p.goal_id !== g.id)
      throw new Problem(400, "WRONG_GOAL", "Choose a project in this goal.");
  } else
    projectId = (
      await one(
        db,
        "SELECT id FROM projects WHERE user_id=? AND goal_id=? AND status='active' ORDER BY created_at DESC LIMIT 1",
        actor.id,
        g.id,
      )
    )?.id;
  const t = taskStatements(
    db,
    actor.id,
    g,
    { ...data, projectId },
    data.kind,
    skills,
    [],
    data.parentId,
  );
  await db.batch(t.writes);
  return c.json({ taskId: t.taskId }, 201);
});
const attemptBody = z.object({
  kind: z.enum(["text", "code", "files", "link", "mixed"]),
  content: z.string().max(60000),
  explanation: z.string().max(12000),
  links: z.array(z.string().url().max(2000)).max(10),
  fileIds: z.array(z.string().uuid()).max(10),
  submit: z.boolean(),
  assistance: z.enum(["independent", "guided", "external"]),
  draftId: z.string().uuid().optional(),
  revision: z.number().int().optional(),
});
app.post("/api/tasks/:id/attempts", async (c) => {
  const body = attemptBody.parse(await c.req.json()),
    db = c.env.DB,
    actor = c.get("actor"),
    task = await owned(db, "tasks", c.req.param("id"), actor.id);
  await unlocked(db, task.goal_id);
  for (const link of body.links)
    if (!/^https?:\/\//i.test(link))
      throw new Problem(400, "INVALID_LINK", "Use an http or https link.");
  for (const fid of body.fileIds) {
    const file = await owned(db, "files", fid, actor.id);
    if (file.goal_id !== task.goal_id)
      throw new Problem(400, "WRONG_GOAL", "Choose files from this goal.");
  }
  if (
    body.submit &&
    !body.content.trim() &&
    !body.links.length &&
    !body.fileIds.length
  )
    throw new Problem(
      400,
      "EMPTY_SUBMISSION",
      "Add your work before submitting.",
    );
  if (body.submit && !body.explanation.trim())
    throw new Problem(
      400,
      "EXPLANATION_REQUIRED",
      "Explain one choice you made. Your reasoning matters.",
    );
  const hints = await one(
    db,
    "SELECT COUNT(*) AS n FROM hints WHERE task_id=? AND user_id=?",
    task.id,
    actor.id,
  );
  const assistance = {
    declared: body.assistance,
    platform_hints: hints!.n,
    external_behavior: "Not observable",
  };
  if (
    body.submit &&
    task.kind === "verification" &&
    (body.assistance !== "independent" || hints!.n)
  )
    throw new Problem(
      403,
      "INDEPENDENCE_REQUIRED",
      "This challenge needs an independent attempt. Return to guided practice if you need help.",
    );
  const attemptId = body.draftId || id(),
    time = now();
  let version = 1;
  const writes: D1PreparedStatement[] = [];
  if (body.draftId) {
    const draft = await owned(db, "attempts", body.draftId, actor.id);
    if (draft.task_id !== task.id || draft.status !== "draft")
      throw new Problem(
        409,
        "IMMUTABLE_SUBMISSION",
        "Submitted versions cannot be edited. Start a new attempt.",
      );
    if (body.revision !== draft.revision)
      throw new Problem(
        409,
        "VERSION_CONFLICT",
        "This draft changed elsewhere. Reload before saving.",
      );
    version = draft.version;
    writes.push(
      stmt(
        db,
        "UPDATE attempts SET kind=?,content=?,explanation=?,links=?,file_ids=?,status=?,assistance=?,revision=revision+1,submitted_at=? WHERE id=? AND user_id=? AND revision=?",
        body.kind,
        body.content,
        body.explanation,
        str(body.links),
        str(body.fileIds),
        body.submit ? "submitted" : "draft",
        str(assistance),
        body.submit ? time : null,
        attemptId,
        actor.id,
        draft.revision,
      ),
    );
  } else {
    const last = await one(
      db,
      "SELECT COALESCE(MAX(version),0) AS v FROM attempts WHERE task_id=?",
      task.id,
    );
    version = last!.v + 1;
    writes.push(
      insert(db, "attempts", {
        id: attemptId,
        user_id: actor.id,
        task_id: task.id,
        version,
        kind: body.kind,
        content: body.content,
        explanation: body.explanation,
        links: str(body.links),
        file_ids: str(body.fileIds),
        status: body.submit ? "submitted" : "draft",
        revision: 1,
        assistance: str(assistance),
        created_at: time,
        submitted_at: body.submit ? time : null,
      }),
    );
  }
  writes.push(
    event(
      db,
      actor.id,
      task.goal_id,
      body.submit ? "work_submitted" : "draft_saved",
      { taskId: task.id, attemptId, version, title: task.title },
    ),
    stmt(
      db,
      "UPDATE goals SET stage=?,updated_at=? WHERE id=? AND user_id=?",
      body.submit ? "monitor" : "teach",
      time,
      task.goal_id,
      actor.id,
    ),
  );
  await db.batch(writes);
  return c.json(
    {
      attemptId,
      version,
      message: body.submit
        ? "You made something real. Take a moment to recognize that."
        : "Your ideas have a place to grow. Draft saved.",
    },
    201,
  );
});
app.post("/api/files", async (c) => {
  const form = await c.req.formData(),
    file = form.get("file"),
    goalId = String(form.get("goalId") || ""),
    actor = c.get("actor"),
    db = c.env.DB;
  if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024)
    throw new Problem(
      400,
      "INVALID_FILE",
      "Choose a non-empty file below 5 MB.",
    );
  await owned(db, "goals", goalId, actor.id);
  if (!c.env.BUCKET)
    throw new Problem(
      503,
      "FILES_NOT_CONFIGURED",
      "File storage is not connected. You can still submit text and links.",
    );
  const allowed =
    /\.(txt|md|py|js|ts|tsx|jsx|json|csv|ipynb|html|css|pdf|png|jpe?g|webp|svg|zip|mp3|mp4|wav)$/i;
  if (!allowed.test(file.name))
    throw new Problem(
      400,
      "FILE_TYPE",
      "Use a supported text, code, document, media or zip file.",
    );
  const access = await entitlement(db, actor.id);
  const reserved = await stmt(
    db,
    "UPDATE users SET storage_bytes=storage_bytes+? WHERE id=? AND storage_bytes+?<=? RETURNING id",
    file.size,
    actor.id,
    file.size,
    access.plan.storage_limit,
  ).first();
  if (!reserved)
    throw new Problem(
      429,
      "STORAGE_LIMIT",
      "You have reached your file allowance. Remove a file or review your plan.",
    );
  const fid = id(),
    key = actor.id + "/" + fid;
  try {
    const text = /\.(txt|md|py|js|ts|tsx|jsx|json|csv|ipynb|html|css)$/i.test(
      file.name,
    )
      ? (await file.text()).slice(0, 50000)
      : null;
    await c.env.BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: "application/octet-stream" },
    });
    await insert(db, "files", {
      id: fid,
      user_id: actor.id,
      goal_id: goalId,
      name: file.name.slice(0, 200),
      mime: file.type || "application/octet-stream",
      size: file.size,
      object_key: key,
      text_content: text,
      created_at: now(),
    }).run();
    return c.json(
      {
        id: fid,
        name: file.name,
        size: file.size,
        inspection: text ? "text_available" : "stored_not_inspected",
      },
      201,
    );
  } catch (e) {
    await c.env.BUCKET.delete(key);
    await run(
      db,
      "UPDATE users SET storage_bytes=MAX(0,storage_bytes-?) WHERE id=?",
      file.size,
      actor.id,
    );
    throw e;
  }
});
app.get("/api/files/:id", async (c) => {
  const f = await owned(
      c.env.DB,
      "files",
      c.req.param("id"),
      c.get("actor").id,
    ),
    object = await c.env.BUCKET.get(f.object_key);
  if (!object)
    throw new Problem(404, "FILE_UNAVAILABLE", "File is unavailable.");
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
});
app.delete("/api/files/:id", async (c) => {
  const actor = c.get("actor"),
    db = c.env.DB,
    f = await owned(db, "files", c.req.param("id"), actor.id);
  const used = await one(
    db,
    "SELECT id FROM attempts WHERE user_id=? AND status='submitted' AND EXISTS(SELECT 1 FROM json_each(file_ids) WHERE value=?) LIMIT 1",
    actor.id,
    f.id,
  );
  if (used)
    throw new Problem(
      409,
      "EVIDENCE_FILE",
      "This file is part of a submitted version. Keep it to preserve the evidence trail, or delete your account data.",
    );
  await c.env.BUCKET.delete(f.object_key);
  await db.batch([
    stmt(db, "DELETE FROM files WHERE id=? AND user_id=?", f.id, actor.id),
    stmt(
      db,
      "UPDATE users SET storage_bytes=MAX(0,storage_bytes-?) WHERE id=?",
      f.size,
      actor.id,
    ),
  ]);
  return c.json({ ok: true });
});
app.post("/api/tasks/:id/feedback", async (c) => {
  const body = z
      .object({
        reviewer: z.string().min(1).max(150),
        role: z.string().min(1).max(150),
        context: z.string().min(1).max(2000),
        feedback: z.string().min(3).max(6000),
        evidenceUrl: z.string().max(2000).default(""),
      })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    t = await owned(db, "tasks", c.req.param("id"), actor.id);
  if (body.evidenceUrl && !/^https?:\/\//i.test(body.evidenceUrl))
    throw new Problem(
      400,
      "INVALID_LINK",
      "Use an http or https evidence URL.",
    );
  await db.batch([
    insert(db, "external_feedback", {
      id: id(),
      user_id: actor.id,
      goal_id: t.goal_id,
      task_id: t.id,
      reviewer: body.reviewer,
      role: body.role,
      context: body.context,
      feedback: body.feedback,
      evidence_url: body.evidenceUrl || null,
      verified_identity: 0,
      created_at: now(),
    }),
    event(db, actor.id, t.goal_id, "external_feedback_added", {
      taskId: t.id,
      reviewer: body.reviewer,
      identity: "Learner-reported; not independently authenticated",
    }),
  ]);
  return c.json({ ok: true }, 201);
});
app.post("/api/tasks/:id/reflections", async (c) => {
  const body = z
      .object({
        learned: z.string().min(3).max(3000),
        next: z.string().max(3000),
      })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    t = await owned(c.env.DB, "tasks", c.req.param("id"), actor.id);
  await event(c.env.DB, actor.id, t.goal_id, "reflection_saved", {
    taskId: t.id,
    ...body,
  }).run();
  return c.json({ ok: true }, 201);
});
app.post("/api/ai", aiRoute);
app.post("/api/jobs/:id/cancel", cancelJob);
app.get("/api/jobs/:id", async (c) =>
  c.json(await owned(c.env.DB, "jobs", c.req.param("id"), c.get("actor").id)),
);
app.patch("/api/evidence/:id", async (c) => {
  const body = z
      .object({ correction: z.string().min(3).max(3000) })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    e = await owned(db, "evidence", c.req.param("id"), actor.id);
  await unlocked(db, e.goal_id);
  await db.batch([
    stmt(
      db,
      "UPDATE evidence SET valid=0,correction=? WHERE id=? AND user_id=?",
      body.correction,
      e.id,
      actor.id,
    ),
    stmt(
      db,
      "UPDATE skills SET status='unverified',confidence='disputed',basis='Learner requested reassessment' WHERE user_id=? AND goal_id=? AND key=? AND NOT EXISTS(SELECT 1 FROM evidence WHERE user_id=? AND goal_id=? AND skill_key=? AND valid=1 AND independent=1 AND id!=?)",
      actor.id,
      e.goal_id,
      e.skill_key,
      actor.id,
      e.goal_id,
      e.skill_key,
      e.id,
    ),
    event(db, actor.id, e.goal_id, "evidence_corrected", {
      evidenceId: e.id,
      correction: body.correction,
    }),
  ]);
  return c.json({ ok: true });
});
app.post("/api/portfolio", async (c) => {
  const body = z
      .object({ attemptId: z.string().uuid() })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    a = await owned(db, "attempts", body.attemptId, actor.id);
  if (a.status !== "submitted")
    throw new Problem(
      409,
      "SUBMISSION_REQUIRED",
      "Submit this version before adding it to your portfolio.",
    );
  const t = await owned(db, "tasks", a.task_id, actor.id);
  const old = await one(
    db,
    "SELECT id FROM portfolio WHERE user_id=? AND attempt_id=?",
    actor.id,
    a.id,
  );
  if (old) return c.json({ id: old.id });
  const pid = id();
  await db.batch([
    insert(db, "portfolio", {
      id: pid,
      user_id: actor.id,
      goal_id: t.goal_id,
      evaluation_id: null,
      attempt_id: a.id,
      title: t.title,
      visibility: "private",
      created_at: now(),
    }),
    event(db, actor.id, t.goal_id, "portfolio_added", { title: t.title }),
  ]);
  return c.json({ id: pid }, 201);
});
app.get("/api/portfolio/:id", async (c) => {
  const actor = c.get("actor"),
    db = c.env.DB,
    p = await owned(db, "portfolio", c.req.param("id"), actor.id),
    a = await owned(db, "attempts", p.attempt_id, actor.id);
  return c.json({
    ...p,
    content: a.content,
    explanation: a.explanation,
    version: a.version,
    task_id: a.task_id,
    assistance: a.assistance,
    links: a.links,
    file_ids: a.file_ids,
    result: p.evaluation_id
      ? (await owned(db, "evaluations", p.evaluation_id, actor.id)).result
      : null,
  });
});
app.patch("/api/portfolio/:id", async (c) => {
  const body = z
      .object({ visibility: z.enum(["private", "shared"]) })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    p = await owned(db, "portfolio", c.req.param("id"), actor.id),
    token = body.visibility === "shared" ? p.share_token || id() : null;
  await run(
    db,
    "UPDATE portfolio SET visibility=?,share_token=? WHERE id=? AND user_id=?",
    body.visibility,
    token,
    p.id,
    actor.id,
  );
  return c.json({
    ok: true,
    shareUrl: token ? new URL(c.req.url).origin + "/?shared=" + token : null,
  });
});
app.patch("/api/suggestions/:id", async (c) => {
  const body = z
      .object({
        status: z.enum(["accepted", "rejected"]),
        title: z.string().min(3).max(200).optional(),
      })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    s = await owned(db, "suggestions", c.req.param("id"), actor.id);
  if (s.status !== "suggested")
    throw new Problem(
      409,
      "ALREADY_REVIEWED",
      "This challenge was already reviewed.",
    );
  await run(
    db,
    "UPDATE suggestions SET status=?,title=? WHERE id=? AND user_id=?",
    body.status,
    body.title || s.title,
    s.id,
    actor.id,
  );
  await event(db, actor.id, s.goal_id, "challenge_" + body.status, {
    title: body.title || s.title,
  }).run();
  return c.json({
    ok: true,
    next:
      body.status === "accepted"
        ? "Use this challenge as a task direction with the Agent."
        : null,
  });
});
app.patch("/api/settings", async (c) => {
  const body = z
    .object({
      name: z.string().min(1).max(100),
      language: z.enum(["en"]),
      timezone: z.string().max(80),
      notifications: z.boolean(),
      teaching_preference: z.string().max(2000),
    })
    .parse(await c.req.json());
  try {
    Intl.DateTimeFormat("en", { timeZone: body.timezone });
  } catch {
    throw new Problem(400, "INVALID_TIMEZONE", "Choose a valid time zone.");
  }
  await run(
    c.env.DB,
    "UPDATE users SET name=?,settings=? WHERE id=?",
    body.name,
    str(body),
    c.get("actor").id,
  );
  return c.json({ ok: true });
});
app.post("/api/feedback", async (c) => {
  const body = z
    .object({ content: z.string().min(3).max(5000) })
    .parse(await c.req.json());
  await insert(c.env.DB, "feedback", {
    id: id(),
    user_id: c.get("actor").id,
    content: body.content,
    status: "open",
    created_at: now(),
  }).run();
  return c.json({ ok: true }, 201);
});
app.get("/api/export", async (c) => {
  const user = c.get("actor").id,
    db = c.env.DB,
    data: Row = { version: 1, exportedAt: now() };
  for (const table of [
    "users",
    "goals",
    "paths",
    "skills",
    "dependencies",
    "tasks",
    "attempts",
    "files",
    "hints",
    "messages",
    "events",
    "evaluations",
    "evidence",
    "portfolio",
    "suggestions",
    "subscriptions",
    "monthly_usage",
    "jobs",
    "ai_calls",
    "feedback",
    "external_feedback",
    "projects",
  ])
    data[table] = await all(
      db,
      `SELECT * FROM ${table} WHERE ${table === "users" ? "id" : "user_id"}=?`,
      user,
    );
  return new Response(str(data), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="kleos-learning-data.json"',
      "Cache-Control": "no-store",
    },
  });
});
app.delete("/api/account", async (c) => {
  const body = z
      .object({ confirmation: z.literal("DELETE MY LEARNING DATA") })
      .parse(await c.req.json()),
    actor = c.get("actor"),
    db = c.env.DB,
    sub = await one(
      db,
      "SELECT * FROM subscriptions WHERE user_id=?",
      actor.id,
    );
  if (
    sub &&
    ["active", "trialing"].includes(sub.status) &&
    sub.period_end > Date.now() / 1000
  )
    throw new Problem(
      409,
      "CANCEL_SUBSCRIPTION_FIRST",
      "Cancel your subscription in the billing portal before deleting your learning data.",
    );
  const running = await one(
    db,
    "SELECT id FROM jobs WHERE user_id=? AND status IN ('running','committing')",
    actor.id,
  );
  if (running)
    throw new Problem(
      409,
      "WORKFLOW_BUSY",
      "Cancel active learning actions before deleting data.",
    );
  const fs = await all(
    db,
    "SELECT object_key FROM files WHERE user_id=?",
    actor.id,
  );
  if (fs.length) await c.env.BUCKET.delete(fs.map((f) => f.object_key));
  await db.batch([
    stmt(db, "DELETE FROM users WHERE id=?", actor.id),
    insert(db, "users", {
      id: actor.id,
      email: "",
      name: "Deleted account",
      settings: "{}",
      deleted_at: now(),
      created_at: now(),
    }),
  ]);
  return c.json({ ok: true });
});
app.post("/api/billing/checkout", checkout);
app.post("/api/billing/portal", portal);
app.use("/api/admin/*", async (c, next) => {
  if (!isAdmin(c.env, c.get("actor").id))
    throw new Problem(
      403,
      "ADMIN_REQUIRED",
      "This area is available to authorized administrators.",
    );
  await next();
});
app.get("/api/admin/overview", async (c) => {
  const db = c.env.DB;
  const result: Row = {};
  for (const table of [
    "users",
    "plans",
    "subscriptions",
    "templates",
    "feedback",
  ])
    result[table] = await all(db, `SELECT * FROM ${table} LIMIT 100`);
  result.calls = await all(
    db,
    "SELECT * FROM ai_calls ORDER BY created_at DESC LIMIT 100",
  );
  result.reviews = await all(
    db,
    "SELECT * FROM evaluations WHERE review_status='pending' ORDER BY created_at DESC LIMIT 100",
  );
  result.audit = await all(
    db,
    "SELECT * FROM audit ORDER BY created_at DESC LIMIT 100",
  );
  return c.json(result);
});
app.put("/api/admin/plans/:id", async (c) => {
  const body = z
    .object({
      name: z.string().min(1).max(100),
      ai_limit: z.number().int().min(0).max(100000),
      storage_limit: z.number().int().min(0).max(10737418240),
      goal_limit: z.number().int().min(1).max(1000),
      enabled: z.number().int().min(0).max(1),
      features: z.array(z.string()).max(15),
    })
    .parse(await c.req.json());
  if (!["free", "pro"].includes(c.req.param("id")))
    throw new Problem(400, "INVALID_PLAN", "Unknown plan.");
  await c.env.DB.batch([
    stmt(
      c.env.DB,
      "UPDATE plans SET name=?,ai_limit=?,storage_limit=?,goal_limit=?,enabled=?,features=? WHERE id=?",
      body.name,
      body.ai_limit,
      body.storage_limit,
      body.goal_limit,
      body.enabled,
      str(body.features),
      c.req.param("id"),
    ),
    insert(c.env.DB, "audit", {
      id: id(),
      actor_id: c.get("actor").id,
      action: "plan_updated",
      target: c.req.param("id"),
      details: str(body),
      created_at: now(),
    }),
  ]);
  return c.json({ ok: true });
});
app.post("/api/admin/templates", async (c) => {
  const body = z
      .object({
        kind: z.enum(["task", "skill", "resource", "rubric"]),
        title: z.string().min(3).max(200),
        content: z.string().min(3).max(30000),
      })
      .parse(await c.req.json()),
    tid = id();
  await c.env.DB.batch([
    insert(c.env.DB, "templates", {
      id: tid,
      ...body,
      version: 1,
      enabled: 1,
      created_at: now(),
    }),
    insert(c.env.DB, "audit", {
      id: id(),
      actor_id: c.get("actor").id,
      action: "template_created",
      target: tid,
      details: str({ kind: body.kind, title: body.title }),
      created_at: now(),
    }),
  ]);
  return c.json({ id: tid }, 201);
});
app.post("/api/admin/recover", async (c) =>
  c.json({ recovered: await recoverJobs(c.env.DB) }),
);
app.notFound((c) =>
  c.req.path.startsWith("/api/")
    ? c.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "This endpoint is unavailable.",
          },
        },
        404,
      )
    : c.env.ASSETS.fetch(c.req.raw),
);
app.onError((error, c) => {
  const status =
    error instanceof Problem
      ? error.status
      : error instanceof ZodError
        ? 400
        : 500;
  const message =
    error instanceof Problem
      ? error.message
      : error instanceof ZodError
        ? "Some information needs another look. " +
          error.issues
            .map((i) => i.path.join(".") + ": " + i.message)
            .slice(0, 3)
            .join("; ")
        : "Something interrupted this action. Your saved work is safe. Please retry.";
  return c.json(
    {
      error: {
        code:
          error instanceof Problem
            ? error.code
            : error instanceof ZodError
              ? "VALIDATION_ERROR"
              : "INTERNAL_ERROR",
        message,
        requestId: c.get("requestId"),
      },
    },
    status as any,
  );
});
export default app;
