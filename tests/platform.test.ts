import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { database, bucket } from "./d1";
import type { Env } from "../worker/types";
import { demos } from "../shared/demos";
import { mapSchema, validateGraph } from "../worker/contracts";
const model = vi.hoisted(() => ({
  response: null as any,
  fail: false,
  calls: 0,
}));
vi.mock("openai", () => ({
  default: class {
    responses = {
      create: async () => {
        model.calls++;
        if (model.fail)
          throw new Error("Synthetic provider failure for test only");
        return (async function* () {
          yield {
            type: "response.output_text.delta",
            delta: JSON.stringify(model.response),
          };
          yield {
            type: "response.completed",
            response: {
              id: "test-response",
              usage: { input_tokens: 150, output_tokens: 300 },
            },
          };
        })();
      },
    };
  },
}));
import app from "../worker/index";
let env: Env, db: ReturnType<typeof database>;
async function request(
  path: string,
  method = "GET",
  body?: any,
  user = "alice",
  extra?: Record<string, string>,
) {
  return app.fetch(
    new Request("https://kleos.test" + path, {
      method,
      headers: {
        "oai-authenticated-user-id": user,
        "oai-authenticated-user-email": user + "@example.test",
        "Content-Type": "application/json",
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
  );
}
async function call(path: string, method = "GET", body?: any, user = "alice") {
  const r = await request(path, method, body, user);
  const data: any = await r.json();
  if (!r.ok) throw new Error(r.status + " " + JSON.stringify(data));
  return data;
}
async function goal() {
  await call("/api/bootstrap");
  const g = await call("/api/goals", "POST", {
    title: "Build a useful Python tool",
    description: "I want to learn through a project.",
  });
  await call("/api/goals/" + g.id, "PATCH", {
    version: 1,
    confirmed: true,
    details: {
      outcome: "Build and explain an expense tool",
      background: "Beginner",
      background_source: "self_report",
      weekly_hours: 3,
      deadline: "",
      constraints: "",
      success_criteria: ["Explain my code and check behavior"],
      preference: "practice",
    },
  });
  return g.id;
}
async function ai(
  goalId: string,
  kind: string,
  value: any,
  options: any = {},
  key = crypto.randomUUID(),
) {
  model.response = value;
  const r = await request("/api/ai", "POST", {
    goalId,
    kind,
    idempotencyKey: key,
    ...options,
  });
  const text = await r.text();
  if (r.headers.get("content-type")?.includes("event-stream")) {
    const result = text.match(/event: result\ndata: (.*)/);
    if (!result) throw new Error(text);
    return JSON.parse(result[1]);
  }
  return { status: r.status, text: JSON.parse(text) };
}
const scenario = demos[0];
beforeEach(() => {
  db = database();
  env = {
    DB: db,
    BUCKET: bucket(),
    ASSETS: { fetch: async () => new Response("assets") } as any,
  };
  model.fail = false;
  model.calls = 0;
});
afterEach(() => db.close());
describe("Kleos learning platform", () => {
  it("requires identity and rejects cross-origin writes", async () => {
    expect(
      (await app.fetch(new Request("https://kleos.test/api/bootstrap"), env))
        .status,
    ).toBe(401);
    await call("/api/bootstrap");
    expect(
      (
        await request(
          "/api/goals",
          "POST",
          { title: "A skill", description: "A real goal" },
          "alice",
          { origin: "https://other.test" },
        )
      ).status,
    ).toBe(403);
  });
  it("persists goals, checks ownership, and preserves versions", async () => {
    const id = await goal();
    const b = await call("/api/goals/" + id);
    expect(b.goal.confirmed).toBe(1);
    expect(b.goal.details.background_source).toBe("self_report");
    await call("/api/bootstrap", "GET", undefined, "bob");
    expect(
      (await request("/api/goals/" + id, "GET", undefined, "bob")).status,
    ).toBe(404);
    expect(
      (
        await request("/api/goals/" + id, "PATCH", {
          version: 1,
          title: "Changed",
        })
      ).status,
    ).toBe(409);
    const boot = await call("/api/bootstrap");
    expect(boot.goals).toHaveLength(1);
  });
  it("validates true acyclic skill dependencies", () => {
    const m = mapSchema.parse({ rationale: "A path", skills: scenario.skills });
    validateGraph(m);
    m.skills[0].prerequisites = [m.skills[1].key];
    expect(() => validateGraph(m)).toThrow("cycles");
  });
  it("supports a complete manual path, immutable submissions, reflection and portfolio without AI", async () => {
    const g = await goal();
    await call("/api/goals/" + g + "/map", "POST", {
      rationale: "A learner-selected path",
      skills: scenario.skills,
    });
    const t = await call("/api/goals/" + g + "/tasks", "POST", {
      task: scenario.task,
      rationale: "A useful first task",
      kind: "project",
    });
    const body = {
      kind: "code",
      content: scenario.sample.content,
      explanation: scenario.sample.explanation,
      links: [],
      fileIds: [],
      submit: false,
      assistance: "guided",
    };
    const a = await call("/api/tasks/" + t.taskId + "/attempts", "POST", body);
    const s = await call("/api/tasks/" + t.taskId + "/attempts", "POST", {
      ...body,
      submit: true,
      draftId: a.attemptId,
      revision: 1,
    });
    expect(
      (
        await request("/api/tasks/" + t.taskId + "/attempts", "POST", {
          ...body,
          draftId: a.attemptId,
          revision: 2,
        })
      ).status,
    ).toBe(409);
    await call("/api/tasks/" + t.taskId + "/reflections", "POST", {
      learned: "A dictionary makes categories easy to find.",
      next: "Try invalid input",
    });
    await call("/api/portfolio", "POST", { attemptId: s.attemptId });
    const b = await call("/api/goals/" + g);
    expect(b.projects).toHaveLength(1);
    expect(b.attempts[0].status).toBe("submitted");
    expect(b.evidence).toHaveLength(0);
    expect((await call("/api/bootstrap")).portfolio).toHaveLength(1);
  });
  it("keeps missing-AI failures honest without consuming quota or losing work", async () => {
    const g = await goal();
    const r = await request("/api/ai", "POST", {
      goalId: g,
      kind: "map",
      idempotencyKey: crypto.randomUUID(),
    });
    expect(r.status).toBe(503);
    expect(((await r.json()) as any).error.code).toBe("AI_NOT_CONFIGURED");
    expect((await call("/api/bootstrap")).access.usage.used).toBe(0);
    expect(model.calls).toBe(0);
  });
  it("launches three idempotent explicitly labelled demos without granting skills", async () => {
    await call("/api/bootstrap");
    for (const s of demos) {
      const a = await call("/api/demos/" + s.id, "POST", {});
      const b = await call("/api/demos/" + s.id, "POST", {});
      expect(a.goalId).toBe(b.goalId);
      const bundle = await call("/api/goals/" + a.goalId);
      expect(bundle.goal.details.is_demo).toBe(true);
      expect(bundle.evidence).toHaveLength(0);
      expect(JSON.parse(bundle.evaluations[0].result).assessment_type).toBe(
        "Scripted demo feedback",
      );
    }
    const boot = await call("/api/bootstrap");
    expect(boot.goals).toHaveLength(3);
    expect(boot.stats.submissions).toBe(0);
    expect(boot.stats.verified_skills).toBe(0);
    expect(model.calls).toBe(0);
  });
  it("executes a full model-backed learning loop with test-only model outputs and evidence validation", async () => {
    env.OPENAI_API_KEY = "test-only-key";
    const g = await goal();
    await ai(g, "map", {
      rationale: "Start from a small meaningful program.",
      skills: scenario.skills,
    });
    const assigned = await ai(g, "assign", {
      rationale: "Try a concrete problem.",
      task: scenario.task,
    });
    const t = assigned.taskId;
    const a = await call("/api/tasks/" + t + "/attempts", "POST", {
      kind: "code",
      content: scenario.sample.content,
      explanation: scenario.sample.explanation,
      links: [],
      fileIds: [],
      submit: true,
      assistance: "guided",
    });
    await ai(
      g,
      "hint",
      {
        answer: "Consider how one category maps to one running total.",
        decision_question: "Why does this structure fit the problem?",
        sources: [],
      },
      { taskId: t, message: "Why use a dictionary?", level: 2 },
    );
    const evaluation = {
      strengths: [
        {
          observation: scenario.sample.strength,
          quote: scenario.sample.quote,
          why_it_matters: "A reasoned choice is easier to inspect.",
        },
      ],
      summary: "A concrete first attempt with a clear explanation.",
      criteria: scenario.task.criteria.map((c) => ({
        criterion_id: c.id,
        status: "met",
        quote: scenario.sample.quote,
        explanation: "A cited explanation supports the criterion.",
      })),
      claims: [
        {
          skill_key: "python-data",
          claim: "Chose and explained a dictionary",
          quote: scenario.sample.quote,
          confidence: "medium",
        },
      ],
      gaps: [],
      misconceptions: [],
      effective_teaching: ["A concrete example"],
      not_demonstrated: ["Independent transfer remains untested"],
      uncertainty: "AI did not execute the code.",
      next_step: "Try a new context.",
      requires_human_review: false,
      domain_boundary: "Text and code review only.",
    };
    await ai(g, "evaluate", evaluation, { taskId: t, attemptId: a.attemptId });
    let b = await call("/api/goals/" + g);
    expect(b.evidence[0].independent).toBe(0);
    const practice = await ai(
      g,
      "adapt",
      {
        decision: "practice",
        rationale: "Focus on a new case.",
        task: {
          ...scenario.task,
          title: "Handle a missing expense category",
          context: "A new targeted exercise.",
        },
      },
      { taskId: t, attemptId: a.attemptId },
    );
    expect(practice.taskId).toBeTruthy();
    const verified = await ai(
      g,
      "verify",
      {
        rationale: "Apply the structure to a new domain.",
        task: {
          ...scenario.task,
          title: "Summarize volunteer hours",
          context: "Use volunteer activity records in a new context.",
          independence: "independent",
        },
      },
      { taskId: t },
    );
    expect(
      (
        await request("/api/ai", "POST", {
          goalId: g,
          kind: "hint",
          taskId: verified.taskId,
          message: "Give me the solution",
          idempotencyKey: crypto.randomUUID(),
        })
      ).status,
    ).toBe(403);
    const va = await call(
      "/api/tasks/" + verified.taskId + "/attempts",
      "POST",
      {
        kind: "code",
        content: scenario.sample.content,
        explanation: scenario.sample.explanation,
        links: [],
        fileIds: [],
        submit: true,
        assistance: "independent",
      },
    );
    await ai(g, "evaluate", evaluation, {
      taskId: verified.taskId,
      attemptId: va.attemptId,
    });
    b = await call("/api/goals/" + g);
    expect(b.evidence.some((e: any) => e.independent === 1)).toBe(true);
    expect(b.skills.find((s: any) => s.key === "python-data").status).toBe(
      "verified",
    );
    expect((await call("/api/bootstrap")).portfolio).toHaveLength(1);
    expect((await call("/api/bootstrap")).access.usage.reserved).toBe(0);
  });
  it("rejects invented positive citations and safely releases failed quota reservations", async () => {
    env.OPENAI_API_KEY = "test-only-key";
    const g = await goal();
    model.response = {
      rationale: "Invalid cyclic path",
      skills: [
        { ...scenario.skills[0], prerequisites: ["python-functions"] },
        scenario.skills[1],
      ],
    };
    const r = await request("/api/ai", "POST", {
      goalId: g,
      kind: "map",
      idempotencyKey: crypto.randomUUID(),
    });
    expect(await r.text()).toContain("event: error");
    const b = await call("/api/goals/" + g);
    expect(b.paths).toHaveLength(0);
    const boot = await call("/api/bootstrap");
    expect(boot.access.usage.used).toBe(0);
    expect(boot.access.usage.reserved).toBe(0);
  });
  it("enforces AI idempotency and server-side allowance", async () => {
    env.OPENAI_API_KEY = "test-only-key";
    const g = await goal(),
      key = crypto.randomUUID(),
      value = { rationale: "A path", skills: scenario.skills };
    await ai(g, "map", value, {}, key);
    const r = await ai(g, "map", value, {}, key);
    expect(r.text.replayed).toBe(true);
    expect(model.calls).toBe(1);
    db.db
      .prepare("UPDATE monthly_usage SET used=30 WHERE user_id=?")
      .run("alice");
    const blocked = await request("/api/ai", "POST", {
      goalId: g,
      kind: "design",
      idempotencyKey: crypto.randomUUID(),
    });
    expect(blocked.status).toBe(429);
  });
  it("restricts administration and retains reported reviewer uncertainty", async () => {
    await call("/api/bootstrap");
    expect((await request("/api/admin/overview")).status).toBe(403);
    env.ADMIN_USER_IDS = "alice";
    expect((await request("/api/admin/overview")).status).toBe(200);
    const d = await call("/api/demos/cooking", "POST", {});
    await call("/api/tasks/" + d.taskId + "/feedback", "POST", {
      reviewer: "A local mentor",
      role: "Cooking mentor",
      context: "Observed a supervised practice session",
      feedback: "Work on consistent preparation.",
      evidenceUrl: "",
    });
    const b = await call("/api/goals/" + d.goalId);
    expect(b.external_feedback[0].verified_identity).toBe(0);
    expect(b.evidence).toHaveLength(0);
  });
  it("keeps sharing revocable and requires ownership", async () => {
    await call("/api/bootstrap");
    await call("/api/demos/python", "POST", {});
    const p = (await call("/api/bootstrap")).portfolio[0];
    const detail = await call("/api/portfolio/" + p.id);
    expect(detail.content).toContain("def summarize");
    expect(
      (await request("/api/portfolio/" + p.id, "GET", undefined, "bob")).status,
    ).toBe(404);
    const share = await call("/api/portfolio/" + p.id, "PATCH", {
      visibility: "shared",
    });
    const token = new URL(share.shareUrl).searchParams.get("shared");
    expect((await request("/api/shared/" + token)).status).toBe(200);
    await call("/api/portfolio/" + p.id, "PATCH", { visibility: "private" });
    expect((await request("/api/shared/" + token)).status).toBe(404);
    expect(
      (
        await request(
          "/api/portfolio/" + p.id,
          "PATCH",
          { visibility: "shared" },
          "bob",
        )
      ).status,
    ).toBe(404);
  });
  it("exports and deletes only the owner’s records", async () => {
    const g = await goal();
    await call("/api/bootstrap", "GET", undefined, "bob");
    const exp = await call("/api/export");
    expect(exp.goals[0].id).toBe(g);
    await call("/api/account", "DELETE", {
      confirmation: "DELETE MY LEARNING DATA",
    });
    expect((await request("/api/bootstrap")).status).toBe(410);
    expect(
      (await call("/api/bootstrap", "GET", undefined, "bob")).user.id,
    ).toBe("bob");
  });
});

describe("Payment and evidence boundaries", () => {
  it("verifies real Stripe signatures, rejects tampering, and handles duplicate events without granting a plan", async () => {
    const Stripe = (await import("stripe")).default;
    env.STRIPE_SECRET_KEY = "sk_test_fixture";
    env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
    const payload = JSON.stringify({
      id: "evt_test_verified",
      object: "event",
      type: "invoice.created",
      livemode: false,
      created: Math.floor(Date.now() / 1000),
      data: { object: { id: "in_test" } },
    });
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET,
    });
    const send = (body: string) =>
      app.fetch(
        new Request("https://kleos.test/api/billing/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": signature,
          },
          body,
        }),
        env,
      );
    expect((await send(payload + " ")).status).toBe(400);
    expect((await send(payload)).status).toBe(200);
    expect(((await (await send(payload)).json()) as any).duplicate).toBe(true);
    expect(
      db.db.prepare("SELECT COUNT(*) AS n FROM subscriptions").get()!.n,
    ).toBe(0);
  });
  it("refuses positive feedback and capability claims without exact evidence", async () => {
    const { validateAssessment } = await import("../worker/learning");
    const result = {
      criteria: scenario.task.criteria.map((c) => ({
        criterion_id: c.id,
        status: "met",
        quote: "This text does not occur in the source.",
        explanation: "Claim",
      })),
      claims: [],
      strengths: [],
    };
    expect(() =>
      validateAssessment(result, scenario.task, scenario.sample.content),
    ).toThrow("exact submission citation");
  });
});
