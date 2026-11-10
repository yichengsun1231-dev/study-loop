import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { streamSSE } from "hono/streaming";
import type { Context } from "hono";
import { AppEnv, Problem, Row, id, now, str } from "./types";
import {
  all,
  one,
  stmt,
  insert,
  entitlement,
  releaseJob,
  owned,
  run,
} from "./db";
import { workflowRequest, workflowSchemas } from "./contracts";
import { workflowContext, workflowWrites } from "./learning";
import { promptFor, PROMPT_VERSION } from "./prompts";
export async function aiRoute(c: Context<AppEnv>) {
  const input = workflowRequest.parse(await c.req.json());
  const actor = c.get("actor"),
    env = c.env,
    db = env.DB;
  const existing = await one(
    db,
    "SELECT * FROM jobs WHERE user_id=? AND idempotency_key=?",
    actor.id,
    input.idempotencyKey,
  );
  const normalized = str({ ...input, idempotencyKey: undefined });
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(normalized),
      ),
    ),
  )
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
  if (existing) {
    if (existing.input_hash !== hash)
      throw new Problem(
        409,
        "IDEMPOTENCY_CONFLICT",
        "This request key was used for a different action.",
      );
    return c.json({ job: existing, replayed: true });
  }
  if (!env.OPENAI_API_KEY)
    throw new Problem(
      503,
      "AI_NOT_CONFIGURED",
      "Your work is safe. AI guidance is not connected yet. You can keep building your goal, skill map and projects, or ask the owner to configure OPENAI_API_KEY.",
    );
  const ctx = await workflowContext(env, actor, input);
  const access = await entitlement(db, actor.id);
  const month = now().slice(0, 7),
    minute = now().slice(0, 16),
    jobId = id(),
    time = now();
  const reservation = await stmt(
    db,
    "UPDATE monthly_usage SET reserved=reserved+1, rate_count=CASE WHEN rate_minute=? THEN rate_count+1 ELSE 1 END,rate_minute=? WHERE user_id=? AND month=? AND used+reserved<? AND (rate_minute IS NULL OR rate_minute!=? OR rate_count<8) RETURNING *",
    minute,
    minute,
    actor.id,
    month,
    access.plan.ai_limit,
    minute,
  ).first();
  if (!reservation)
    throw new Problem(
      429,
      "QUOTA_OR_RATE_LIMIT",
      "You have reached your current AI allowance or request limit. Your drafts are saved. Try again shortly or review your plan.",
    );
  const job = {
    id: jobId,
    user_id: actor.id,
    goal_id: input.goalId,
    idempotency_key: input.idempotencyKey,
    kind: input.kind,
    status: "running",
    input_hash: hash,
    goal_version: ctx.goal.version,
    usage_month: month,
    reserved: 1,
    created_at: time,
    updated_at: time,
  };
  try {
    await insert(db, "jobs", job).run();
  } catch (error) {
    await run(
      db,
      "UPDATE monthly_usage SET reserved=MAX(0,reserved-1) WHERE user_id=? AND month=?",
      actor.id,
      month,
    );
    throw new Problem(
      409,
      "WORKFLOW_BUSY",
      "Another learning action is in progress. Wait for it before retrying.",
    );
  }
  return streamSSE(c, async (stream) => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 110000);
    stream.onAbort(() => abort.abort());
    const started = Date.now();
    let output = "",
      inputTokens = 0,
      outputTokens = 0,
      providerId: string | null = null,
      cost: number | null = null;
    try {
      await stream.writeSSE({
        event: "status",
        data: str({
          jobId,
          status: "thinking",
          message: "Considering your goal and your work…",
        }),
      });
      const latest = await owned(db, "goals", input.goalId, actor.id);
      if (latest.version !== job.goal_version)
        throw new Problem(
          409,
          "VERSION_CONFLICT",
          "Your goal changed. Retry with the updated version.",
        );
      const client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        maxRetries: 1,
        timeout: 50000,
      });
      const response = await client.responses.create(
        {
          model: env.OPENAI_MODEL || "gpt-4.1-mini",
          instructions: promptFor(input.kind),
          input: [
            {
              role: "user",
              content: "UNTRUSTED LEARNER CONTEXT (JSON):\n" + str(ctx.context),
            },
          ],
          text: {
            format: zodTextFormat(
              workflowSchemas[input.kind] as any,
              "kleos_" + input.kind,
            ),
          },
          max_output_tokens: 6000,
          stream: true,
          store: false,
        },
        { signal: abort.signal },
      );
      let completed = false;
      for await (const e of response) {
        if (e.type === "response.output_text.delta") {
          output += e.delta;
          await stream.writeSSE({
            event: "delta",
            data: str({ text: e.delta }),
          });
        }
        if (e.type === "response.completed") {
          completed = true;
          inputTokens = e.response.usage?.input_tokens || 0;
          outputTokens = e.response.usage?.output_tokens || 0;
          providerId = e.response.id;
        }
        if (e.type === "response.failed" || e.type === "response.incomplete")
          throw new Error("The model could not finish this response.");
      }
      if (!completed)
        throw new Error("The model response ended before completion.");
      if (env.MODEL_INPUT_USD_PER_MILLION && env.MODEL_OUTPUT_USD_PER_MILLION)
        cost =
          (inputTokens * Number(env.MODEL_INPUT_USD_PER_MILLION) +
            outputTokens * Number(env.MODEL_OUTPUT_USD_PER_MILLION)) /
          1e6;
      const validated = workflowSchemas[input.kind].parse(JSON.parse(output));
      const proposal = workflowWrites(
        db,
        actor.id,
        input.kind,
        ctx,
        validated,
        input,
      );
      const lock = await stmt(
        db,
        "UPDATE jobs SET status='committing',updated_at=? WHERE id=? AND status='running' RETURNING id",
        now(),
        jobId,
      ).first();
      if (!lock)
        throw new Problem(
          409,
          "CANCELLED",
          "This action was cancelled. Your previous work is unchanged.",
        );
      await db.batch([
        ...proposal.writes,
        insert(db, "ai_calls", {
          id: id(),
          user_id: actor.id,
          job_id: jobId,
          model: env.OPENAI_MODEL || "gpt-4.1-mini",
          prompt_version: PROMPT_VERSION,
          provider_id: providerId,
          latency_ms: Date.now() - started,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost,
          status: "succeeded",
          error: null,
          created_at: now(),
        }),
        stmt(
          db,
          "UPDATE monthly_usage SET reserved=MAX(0,reserved-1),used=used+1,input_tokens=input_tokens+?,output_tokens=output_tokens+?,estimated_cost=estimated_cost+? WHERE user_id=? AND month=?",
          inputTokens,
          outputTokens,
          cost || 0,
          actor.id,
          month,
        ),
        stmt(
          db,
          "UPDATE jobs SET status='succeeded',result=?,reserved=0,updated_at=? WHERE id=?",
          str(proposal.result),
          now(),
          jobId,
        ),
      ]);
      await stream.writeSSE({
        event: "result",
        data: str({ jobId, ...proposal.result }),
      });
    } catch (error) {
      const cancelled = abort.signal.aborted;
      const safe = cancelled
        ? "The request was stopped. Your saved work is unchanged."
        : error instanceof Problem
          ? error.message
          : "This AI action could not be completed safely. Your work is saved. Please retry.";
      const fresh = await one(db, "SELECT * FROM jobs WHERE id=?", jobId);
      if (fresh && ["running", "committing"].includes(fresh.status)) {
        await db.batch([
          stmt(
            db,
            "UPDATE monthly_usage SET reserved=MAX(0,reserved-1) WHERE user_id=? AND month=? AND EXISTS(SELECT 1 FROM jobs WHERE id=? AND reserved=1)",
            actor.id,
            month,
            jobId,
          ),
          stmt(
            db,
            "UPDATE jobs SET status=?,error=?,reserved=0,updated_at=? WHERE id=? AND status IN ('running','committing')",
            cancelled ? "cancelled" : "failed",
            safe,
            now(),
            jobId,
          ),
          insert(db, "ai_calls", {
            id: id(),
            user_id: actor.id,
            job_id: jobId,
            model: env.OPENAI_MODEL || "gpt-4.1-mini",
            prompt_version: PROMPT_VERSION,
            provider_id: providerId,
            latency_ms: Date.now() - started,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost,
            status: cancelled ? "cancelled" : "failed",
            error: cancelled
              ? "ABORTED"
              : error instanceof Problem
                ? error.code
                : "MODEL_OR_VALIDATION_ERROR",
            created_at: now(),
          }),
        ]);
      }
      try {
        await stream.writeSSE({
          event: "error",
          data: str({
            jobId,
            code: cancelled ? "CANCELLED" : "AI_ACTION_FAILED",
            message: safe,
          }),
        });
      } catch {}
    } finally {
      clearTimeout(timer);
    }
  });
}
export async function cancelJob(c: Context<AppEnv>) {
  const job = await owned(
    c.env.DB,
    "jobs",
    c.req.param("id")!,
    c.get("actor").id,
  );
  if (job.status === "committing")
    throw new Problem(
      409,
      "COMMITTING",
      "This action is saving its final result.",
    );
  if (job.status === "running")
    await releaseJob(c.env.DB, job, "cancelled", "Cancelled by learner.");
  return c.json({ ok: true });
}
export async function recoverJobs(db: D1Database, user?: string) {
  const jobs = await all(
    db,
    `SELECT * FROM jobs WHERE status IN ('running','committing') AND updated_at<?${user ? " AND user_id=?" : ""}`,
    new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ...(user ? [user] : []),
  );
  for (const j of jobs) {
    await db.batch([
      stmt(
        db,
        "UPDATE monthly_usage SET reserved=MAX(0,reserved-1) WHERE user_id=? AND month=? AND EXISTS(SELECT 1 FROM jobs WHERE id=? AND reserved=1)",
        j.user_id,
        j.usage_month,
        j.id,
      ),
      stmt(
        db,
        "UPDATE jobs SET status='failed',error='Action interrupted. Retry safely.',reserved=0,updated_at=? WHERE id=? AND status IN ('running','committing')",
        now(),
        j.id,
      ),
    ]);
  }
  return jobs.length;
}
