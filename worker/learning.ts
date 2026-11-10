import { Actor, Env, Problem, Row, id, now, parse, str } from "./types";
import { all, one, owned, stmt, insert, event } from "./db";
import { mapSchema, taskSpec, validateGraph, WorkflowKind } from "./contracts";
import type { z } from "zod";
export async function unlocked(db: D1Database, goalId: string) {
  if (
    await one(
      db,
      "SELECT id FROM jobs WHERE goal_id=? AND status IN ('running','committing')",
      goalId,
    )
  )
    throw new Problem(
      409,
      "WORKFLOW_BUSY",
      "A learning action is in progress. Cancel it or wait before editing this goal.",
    );
}
export async function goalBundle(db: D1Database, user: string, goalId: string) {
  const goal = await owned(db, "goals", goalId, user);
  const names = [
    "projects",
    "paths",
    "skills",
    "tasks",
    "messages",
    "hints",
    "events",
    "evidence",
    "evaluations",
    "suggestions",
    "files",
    "external_feedback",
  ];
  const data: Row = { goal: { ...goal, details: parse(goal.details) } };
  const lists = await Promise.all(
    names.map((t) =>
      all(
        db,
        `SELECT * FROM ${t} WHERE user_id=? AND goal_id=? ORDER BY created_at DESC LIMIT 200`,
        user,
        goalId,
      ),
    ),
  );
  names.forEach((t, i) => (data[t] = lists[i]));
  data.dependencies = await all(
    db,
    "SELECT d.* FROM dependencies d JOIN skills s ON s.id=d.skill_id WHERE d.user_id=? AND s.goal_id=?",
    user,
    goalId,
  );
  data.attempts = await all(
    db,
    "SELECT a.* FROM attempts a JOIN tasks t ON t.id=a.task_id WHERE a.user_id=? AND t.goal_id=? ORDER BY a.created_at DESC LIMIT 100",
    user,
    goalId,
  );
  data.jobs = await all(
    db,
    "SELECT id,kind,status,error,result,created_at,updated_at FROM jobs WHERE user_id=? AND goal_id=? ORDER BY created_at DESC LIMIT 10",
    user,
    goalId,
  );
  return data;
}
export async function workflowContext(env: Env, actor: Actor, input: Row) {
  const b = await goalBundle(env.DB, actor.id, input.goalId);
  const goal = b.goal;
  if (goal.status !== "active")
    throw new Problem(
      409,
      "GOAL_PAUSED",
      "Resume this goal before continuing.",
    );
  if (input.kind !== "discover" && !goal.confirmed)
    throw new Problem(
      409,
      "CONFIRM_GOAL",
      "Review and confirm your goal first.",
    );
  const currentPath = b.paths[0];
  const skills = b.skills.filter((s: Row) => s.path_id === currentPath?.id);
  if (
    ["assign", "diagnose", "verify", "adapt"].includes(input.kind) &&
    !skills.length
  )
    throw new Problem(409, "MAP_REQUIRED", "Create your skill map first.");
  let task: Row | null = null,
    attempt: Row | null = null;
  if (input.taskId) {
    task = await owned(env.DB, "tasks", input.taskId, actor.id);
    if (task.goal_id !== goal.id)
      throw new Problem(
        400,
        "WRONG_GOAL",
        "This task belongs to another goal.",
      );
  }
  if (["hint", "evaluate", "adapt"].includes(input.kind) && !task)
    throw new Problem(400, "TASK_REQUIRED", "Choose a task first.");
  if (input.kind === "hint" && task?.kind === "verification")
    throw new Problem(
      403,
      "INDEPENDENCE_REQUIRED",
      "This is an independent challenge. Save your work and return to a guided practice task for help.",
    );
  if (input.attemptId) {
    attempt = await owned(env.DB, "attempts", input.attemptId, actor.id);
    if (attempt.task_id !== task?.id)
      throw new Problem(
        400,
        "WRONG_TASK",
        "This attempt belongs to another task.",
      );
  }
  if (input.kind === "evaluate" && attempt?.status !== "submitted")
    throw new Problem(
      400,
      "SUBMISSION_REQUIRED",
      "Submit your work before requesting an assessment.",
    );
  if (input.kind === "verify" && !b.evaluations.length)
    throw new Problem(
      409,
      "PRACTICE_REQUIRED",
      "Submit and assess a practice task before creating a transfer challenge.",
    );
  if (
    input.kind === "adapt" &&
    !b.evaluations.some((e: Row) => e.task_id === task!.id)
  )
    throw new Problem(
      409,
      "FEEDBACK_REQUIRED",
      "Assess the current task before adapting it.",
    );
  const attemptFiles = attempt
    ? b.files.filter((f: Row) =>
        parse<string[]>(attempt!.file_ids, []).includes(f.id),
      )
    : [];
  const source = [
    attempt?.content || "",
    attempt?.explanation || "",
    ...attemptFiles.map((f: Row) => f.text_content || ""),
  ].join("\n");
  const context = {
    goal,
    skills: skills.map((s: Row) => ({ ...s, standards: parse(s.standards) })),
    dependencies: b.dependencies,
    task: task ? { ...task, spec: parse(task.spec) } : null,
    attempt: attempt
      ? {
          ...attempt,
          links: parse(attempt.links),
          assistance: parse(attempt.assistance),
          files: attemptFiles.map((f: Row) => ({
            name: f.name,
            text: f.text_content?.slice(0, 18000) || null,
            inspection: f.text_content
              ? "text extracted"
              : "stored; not inspected",
          })),
        }
      : null,
    recent_attempts: b.attempts
      .slice(0, 6)
      .map((a: Row) => ({ ...a, content: a.content.slice(0, 7000) })),
    evidence: b.evidence.filter((e: Row) => e.valid).slice(0, 25),
    recent_evaluations: b.evaluations
      .slice(0, 4)
      .map((e: Row) => parse(e.result)),
    recent_hints: b.hints.slice(0, 8),
    conversation: b.messages.slice(0, 12).reverse(),
    previous_tasks: b.tasks
      .slice(0, 12)
      .map((t: Row) => ({
        id: t.id,
        title: t.title,
        kind: t.kind,
        spec: parse(t.spec),
      })),
    external_feedback: b.external_feedback.slice(0, 10),
    rejected_challenges: b.suggestions
      .filter((s: Row) => s.status === "rejected")
      .map((s: Row) => ({ title: s.title, details: parse(s.details) })),
    learner_message: input.message,
    requested_hint_level: input.level,
  };
  const serialized = str(context);
  if (serialized.length > 100000)
    throw new Problem(
      413,
      "CONTEXT_TOO_LARGE",
      "This goal has too much recent context. Export your work and start a narrower task.",
    );
  return { b, goal, skills, task, attempt, source, context };
}
export function mapStatements(
  db: D1Database,
  user: string,
  goal: Row,
  data: z.infer<typeof mapSchema>,
  source: string,
) {
  validateGraph(data);
  const pathId = id(),
    time = now();
  const skills = data.skills.map((s) => ({ ...s, id: id() }));
  const byKey = new Map(skills.map((s) => [s.key, s.id]));
  const writes = [
    insert(db, "paths", {
      id: pathId,
      user_id: user,
      goal_id: goal.id,
      version: goal.version + 1,
      rationale: data.rationale,
      created_at: time,
    }),
  ];
  for (const s of skills) {
    writes.push(
      insert(db, "skills", {
        id: s.id,
        user_id: user,
        goal_id: goal.id,
        path_id: pathId,
        key: s.key,
        name: s.name,
        definition: s.definition,
        relevance: s.relevance,
        standards: str(s.standards),
        next_practice: s.next_practice,
        status: "unverified",
        confidence: "unknown",
        basis: `${source}. ${s.basis}`,
        created_at: time,
      }),
    );
    writes.push(
      stmt(
        db,
        "UPDATE skills SET status='verified', confidence='supported', basis='Retained independent evidence in this goal' WHERE id=? AND EXISTS(SELECT 1 FROM evidence WHERE user_id=? AND goal_id=? AND skill_key=? AND valid=1 AND independent=1)",
        s.id,
        user,
        goal.id,
        s.key,
      ),
    );
    for (const dep of s.prerequisites)
      writes.push(
        insert(db, "dependencies", {
          id: id(),
          user_id: user,
          skill_id: s.id,
          prerequisite_id: byKey.get(dep)!,
        }),
      );
  }
  writes.push(
    stmt(
      db,
      "UPDATE goals SET stage='map',version=version+1,updated_at=? WHERE id=? AND user_id=?",
      time,
      goal.id,
      user,
    ),
    event(db, user, goal.id, "map_created", {
      pathId,
      source,
      rationale: data.rationale,
    }),
  );
  return { writes, pathId };
}
export function taskStatements(
  db: D1Database,
  user: string,
  goal: Row,
  data: Row,
  kind: string,
  skills: Row[],
  previousTasks: Row[],
  parentId?: string,
) {
  const spec = taskSpec.parse({
    preparation: "Review the task and choose the resources you need.",
    alternative_task:
      "If the real-world opportunity is unavailable, analyze a public example or rehearse the same skill in a simulated setting. Keep it labelled as a simulation.",
    collaboration_rules:
      "Acknowledge collaborators, record your own contribution and follow any event or competition AI rules.",
    privacy_notes:
      "Share only information you have permission to use. Do not record other people or include private contact information without appropriate permission.",
    ...data.task,
  });
  const keys = new Set(skills.map((s) => s.key));
  if (spec.skill_keys.some((k) => !keys.has(k)))
    throw new Error("Task references skills outside this goal.");
  if (kind === "verification") {
    if (spec.independence !== "independent")
      throw new Error("Verification tasks must require independent work.");
    const normalize = (s: string) => s.toLowerCase().replace(/\W/g, "");
    if (
      previousTasks.some(
        (t) =>
          normalize(t.title) === normalize(spec.title) ||
          normalize(parse(t.spec).context || "") === normalize(spec.context),
      )
    )
      throw new Error("Verification must use a new transfer context.");
  }
  const taskId = id(),
    time = now(),
    projectId =
      data.projectId ||
      previousTasks.find((t) => t.project_id)?.project_id ||
      id();
  const projectWrites =
    data.projectId || previousTasks.some((t) => t.project_id)
      ? []
      : [
          insert(db, "projects", {
            id: projectId,
            user_id: user,
            goal_id: goal.id,
            title: "First project: " + goal.title.slice(0, 145),
            outcome: spec.deliverable,
            status: "active",
            version: 1,
            created_at: time,
          }),
        ];
  return {
    taskId,
    writes: [
      ...projectWrites,
      insert(db, "tasks", {
        id: taskId,
        user_id: user,
        goal_id: goal.id,
        project_id: projectId,
        title: spec.title,
        kind,
        spec: str({
          ...spec,
          rationale: data.rationale,
          decision: data.decision || null,
        }),
        status: "open",
        version: 1,
        parent_id: parentId || null,
        created_at: time,
      }),
      stmt(
        db,
        "UPDATE goals SET stage=?,version=version+1,updated_at=? WHERE id=? AND user_id=?",
        kind === "verification" ? "verify" : "assign",
        time,
        goal.id,
        user,
      ),
      event(db, user, goal.id, "task_assigned", {
        taskId,
        kind,
        rationale: data.rationale,
        decision: data.decision,
      }),
    ],
  };
}
export const highRisk = (text: string) =>
  /\b(medical|clinical|surgery|diagnos(?:e|is)|aviation|piloting|live electrical|structural engineering|patient|firearm)\b/i.test(
    text,
  );
export function validateAssessment(data: Row, spec: Row, source: string) {
  const criteria = spec.criteria as Row[];
  const ids = new Set(data.criteria.map((r: Row) => r.criterion_id));
  if (
    ids.size !== criteria.length ||
    data.criteria.length !== criteria.length ||
    criteria.some((c) => !ids.has(c.id))
  )
    throw new Error(
      "Assessment must cover every rubric criterion exactly once.",
    );
  for (const r of data.criteria) {
    if (r.status === "met" && (!r.quote.trim() || !source.includes(r.quote)))
      throw new Error(
        "Positive assessment lacks an exact submission citation.",
      );
  }
  for (const s of data.strengths || []) {
    if (!source.includes(s.quote))
      throw new Error("Positive feedback must cite the learner’s actual work.");
  }
  for (const c of data.claims) {
    if (!spec.skill_keys.includes(c.skill_key) || !source.includes(c.quote))
      throw new Error(
        "Capability claim is not supported by this task and submission.",
      );
  }
}
export function evaluationStatements(
  db: D1Database,
  user: string,
  ctx: Row,
  data: Row,
) {
  const { goal, task, attempt, source, b } = ctx;
  const spec = parse(task.spec);
  validateAssessment(data, spec, source);
  const assistance = parse(attempt.assistance);
  const independent =
    task.kind === "verification" &&
    spec.independence === "independent" &&
    assistance.declared === "independent" &&
    assistance.platform_hints === 0;
  const requiresReview =
    data.requires_human_review ||
    ["mentor", "mixed"].includes(spec.verification_method) ||
    highRisk(goal.description + " " + goal.title + " " + spec.context) ||
    !source.trim();
  const passed =
    data.criteria.every((c: Row) => c.status === "met") && !requiresReview;
  const verificationPassed =
    passed && independent && !goal.details?.is_demo && data.claims.length > 0;
  const evaluationId = id(),
    time = now();
  const checks = [
    {
      name: "Submission present",
      passed: !!(
        attempt.content.trim() ||
        parse(attempt.file_ids, []).length ||
        parse(attempt.links, []).length
      ),
    },
    {
      name: "Decision explanation provided",
      passed: !!attempt.explanation.trim(),
    },
    {
      name: "Learner code executed",
      passed: null,
      note: "No isolated execution service configured. No code was run.",
    },
  ];
  const final = {
    ...data,
    objective_checks: checks,
    independent,
    verification_passed: verificationPassed,
    assistance,
    assessment_type: "AI rubric assessment",
    external_authorship:
      "Not observable; independence includes learner declaration",
    requires_human_review: requiresReview,
  };
  const writes = [
    insert(db, "evaluations", {
      id: evaluationId,
      user_id: user,
      goal_id: goal.id,
      task_id: task.id,
      attempt_id: attempt.id,
      result: str(final),
      passed: passed ? 1 : 0,
      requires_review: requiresReview ? 1 : 0,
      review_status: requiresReview ? "pending" : "none",
      created_at: time,
    }),
  ];
  for (const c of data.claims) {
    writes.push(
      insert(db, "evidence", {
        id: id(),
        user_id: user,
        goal_id: goal.id,
        skill_key: c.skill_key,
        task_id: task.id,
        attempt_id: attempt.id,
        evaluation_id: evaluationId,
        claim: c.claim,
        quote: c.quote,
        confidence: c.confidence,
        independent: verificationPassed ? 1 : 0,
        valid: 1,
        created_at: time,
      }),
    );
    if (verificationPassed)
      writes.push(
        stmt(
          db,
          "UPDATE skills SET status='verified',confidence=?,basis=? WHERE user_id=? AND goal_id=? AND key=?",
          c.confidence,
          `Independent task ${task.id}, attempt v${attempt.version}, ${time}`,
          user,
          goal.id,
          c.skill_key,
        ),
      );
    else
      writes.push(
        stmt(
          db,
          "UPDATE skills SET status='practicing',confidence='provisional',basis=? WHERE user_id=? AND goal_id=? AND key=? AND status!='verified'",
          `Observed in ${task.kind}; independent verification pending`,
          user,
          goal.id,
          c.skill_key,
        ),
      );
  }
  if (verificationPassed)
    writes.push(
      insert(db, "portfolio", {
        id: id(),
        user_id: user,
        goal_id: goal.id,
        evaluation_id: evaluationId,
        attempt_id: attempt.id,
        title: task.title,
        visibility: "private",
        created_at: time,
      }),
    );
  writes.push(
    stmt(
      db,
      "UPDATE tasks SET status=? WHERE id=? AND user_id=?",
      passed ? "complete" : "revision",
      task.id,
      user,
    ),
    stmt(
      db,
      "UPDATE goals SET stage=?,version=version+1,updated_at=? WHERE id=? AND user_id=?",
      verificationPassed ? "assign" : "adapt",
      time,
      goal.id,
      user,
    ),
    event(
      db,
      user,
      goal.id,
      verificationPassed
        ? "independent_verification_passed"
        : "assessment_completed",
      { evaluationId, attemptId: attempt.id, passed, requiresReview },
    ),
  );
  return {
    writes,
    result: { evaluationId, passed, verificationPassed, requiresReview },
  };
}
export function workflowWrites(
  db: D1Database,
  user: string,
  kind: WorkflowKind,
  ctx: Row,
  data: Row,
  input: Row,
) {
  const { goal, b, task } = ctx;
  let writes: D1PreparedStatement[] = [],
    result: Row = { kind };
  const time = now();
  if (kind === "discover") {
    writes.push(
      stmt(
        db,
        "UPDATE goals SET details=?,version=version+1,updated_at=? WHERE id=? AND user_id=?",
        str(data.details),
        time,
        goal.id,
        user,
      ),
    );
    result = { ...result, ...data };
  } else if (kind === "map") {
    const m = mapStatements(
      db,
      user,
      goal,
      data as any,
      "AI proposed path; capability not assessed",
    );
    writes.push(...m.writes);
    result.pathId = m.pathId;
  } else if (["assign", "diagnose", "verify", "adapt"].includes(kind)) {
    const t = taskStatements(
      db,
      user,
      goal,
      {
        ...data,
        projectId:
          task?.project_id ||
          b.projects.find((p: Row) => p.status === "active")?.id,
      },
      kind === "verify"
        ? "verification"
        : kind === "diagnose"
          ? "diagnostic"
          : kind === "adapt"
            ? "practice"
            : "project",
      ctx.skills,
      b.tasks,
      task?.id,
    );
    writes.push(...t.writes);
    result = {
      ...result,
      taskId: t.taskId,
      rationale: data.rationale,
      decision: data.decision,
    };
  } else if (kind === "hint") {
    writes.push(
      insert(db, "hints", {
        id: id(),
        user_id: user,
        goal_id: goal.id,
        task_id: task.id,
        level: input.level,
        question: input.message,
        answer: str(data),
        created_at: time,
      }),
      stmt(
        db,
        "UPDATE goals SET stage='teach',version=version+1,updated_at=? WHERE id=? AND user_id=?",
        time,
        goal.id,
        user,
      ),
      event(db, user, goal.id, "hint_used", {
        taskId: task.id,
        level: input.level,
      }),
    );
    result = { ...result, ...data };
  } else if (kind === "evaluate") {
    const e = evaluationStatements(db, user, ctx, data);
    writes.push(...e.writes);
    result = { ...result, ...e.result };
  } else if (kind === "design") {
    for (const s of data.suggestions) {
      if (
        !b.suggestions.some(
          (old: Row) =>
            old.status === "rejected" &&
            old.title.toLowerCase() === s.title.toLowerCase(),
        )
      )
        writes.push(
          insert(db, "suggestions", {
            id: id(),
            user_id: user,
            goal_id: goal.id,
            title: s.title,
            details: str(s),
            status: "suggested",
            created_at: time,
          }),
        );
    }
    result.count = data.suggestions.length;
  }
  const text =
    kind === "discover"
      ? data.reply
      : kind === "hint"
        ? data.answer + "\n\n" + data.decision_question
        : kind === "evaluate"
          ? data.summary
          : data.rationale || "New challenges are ready for you to review.";
  if (input.message)
    writes.push(
      insert(db, "messages", {
        id: id(),
        user_id: user,
        goal_id: goal.id,
        role: "user",
        kind,
        content: input.message,
        created_at: time,
      }),
    );
  writes.push(
    insert(db, "messages", {
      id: id(),
      user_id: user,
      goal_id: goal.id,
      role: "assistant",
      kind,
      content: text,
      created_at: time,
    }),
  );
  return { writes, result };
}
