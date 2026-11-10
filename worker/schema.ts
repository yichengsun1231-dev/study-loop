import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
const at = () => text("created_at").notNull();
const uid = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });
export const users = sqliteTable("users", {
  id: text().primaryKey(),
  email: text().notNull(),
  name: text().notNull(),
  settings: text().notNull().default("{}"),
  storageBytes: integer("storage_bytes").notNull().default(0),
  deletedAt: text("deleted_at"),
  createdAt: at(),
});
export const goals = sqliteTable(
  "goals",
  {
    id: text().primaryKey(),
    userId: uid(),
    title: text().notNull(),
    description: text().notNull(),
    details: text().notNull().default("{}"),
    status: text().notNull().default("active"),
    stage: text().notNull().default("discover"),
    confirmed: integer().notNull().default(0),
    version: integer().notNull().default(1),
    createdAt: at(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("goals_owner").on(t.userId)],
);
export const paths = sqliteTable("paths", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  version: integer().notNull(),
  rationale: text().notNull(),
  createdAt: at(),
});
export const skills = sqliteTable("skills", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  pathId: text("path_id")
    .notNull()
    .references(() => paths.id, { onDelete: "cascade" }),
  key: text().notNull(),
  name: text().notNull(),
  definition: text().notNull(),
  relevance: text().notNull(),
  standards: text().notNull(),
  nextPractice: text("next_practice").notNull(),
  status: text().notNull().default("unverified"),
  confidence: text().notNull().default("unknown"),
  basis: text().notNull().default("No observed evidence"),
  createdAt: at(),
});
export const dependencies = sqliteTable("dependencies", {
  id: text().primaryKey(),
  userId: uid(),
  skillId: text("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  prerequisiteId: text("prerequisite_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
});
export const tasks = sqliteTable("tasks", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  title: text().notNull(),
  kind: text().notNull(),
  spec: text().notNull(),
  status: text().notNull().default("open"),
  version: integer().notNull().default(1),
  parentId: text("parent_id"),
  createdAt: at(),
});
export const attempts = sqliteTable(
  "attempts",
  {
    id: text().primaryKey(),
    userId: uid(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    version: integer().notNull(),
    kind: text().notNull(),
    content: text().notNull(),
    explanation: text().notNull(),
    links: text().notNull().default("[]"),
    fileIds: text("file_ids").notNull().default("[]"),
    status: text().notNull(),
    revision: integer().notNull().default(1),
    assistance: text().notNull(),
    createdAt: at(),
    submittedAt: text("submitted_at"),
  },
  (t) => [uniqueIndex("attempt_version").on(t.taskId, t.version)],
);
export const files = sqliteTable("files", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id").references(() => goals.id, { onDelete: "cascade" }),
  name: text().notNull(),
  mime: text().notNull(),
  size: integer().notNull(),
  objectKey: text("object_key").notNull(),
  textContent: text("text_content"),
  createdAt: at(),
});
export const hints = sqliteTable("hints", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  level: integer().notNull(),
  question: text().notNull(),
  answer: text().notNull(),
  createdAt: at(),
});
export const messages = sqliteTable("messages", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  role: text().notNull(),
  kind: text().notNull(),
  content: text().notNull(),
  createdAt: at(),
});
export const events = sqliteTable(
  "events",
  {
    id: text().primaryKey(),
    userId: uid(),
    goalId: text("goal_id").references(() => goals.id, { onDelete: "cascade" }),
    kind: text().notNull(),
    data: text().notNull(),
    createdAt: at(),
  },
  (t) => [index("events_owner_time").on(t.userId, t.createdAt)],
);
export const evaluations = sqliteTable("evaluations", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  attemptId: text("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  result: text().notNull(),
  passed: integer().notNull(),
  requiresReview: integer("requires_review").notNull(),
  reviewStatus: text("review_status").notNull().default("none"),
  createdAt: at(),
});
export const evidence = sqliteTable("evidence", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  skillKey: text("skill_key").notNull(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  attemptId: text("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluations.id, { onDelete: "cascade" }),
  claim: text().notNull(),
  quote: text().notNull(),
  confidence: text().notNull(),
  independent: integer().notNull(),
  valid: integer().notNull().default(1),
  correction: text(),
  createdAt: at(),
});
export const portfolio = sqliteTable("portfolio", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  evaluationId: text("evaluation_id").references(() => evaluations.id, {
    onDelete: "cascade",
  }),
  attemptId: text("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  title: text().notNull(),
  visibility: text().notNull().default("private"),
  shareToken: text("share_token"),
  createdAt: at(),
});
export const suggestions = sqliteTable("suggestions", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text().notNull(),
  details: text().notNull(),
  status: text().notNull().default("suggested"),
  createdAt: at(),
});
export const plans = sqliteTable("plans", {
  id: text().primaryKey(),
  name: text().notNull(),
  aiLimit: integer("ai_limit").notNull(),
  storageLimit: integer("storage_limit").notNull(),
  goalLimit: integer("goal_limit").notNull(),
  enabled: integer().notNull().default(1),
  features: text().notNull(),
});
export const subscriptions = sqliteTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  customerId: text("customer_id").unique(),
  subscriptionId: text("subscription_id"),
  status: text().notNull().default("free"),
  plan: text().notNull().default("free"),
  periodEnd: integer("period_end"),
  cancelAtEnd: integer("cancel_at_end").notNull().default(0),
  eventCreated: integer("event_created").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});
export const monthlyUsage = sqliteTable(
  "monthly_usage",
  {
    id: text().primaryKey(),
    userId: uid(),
    month: text().notNull(),
    used: integer().notNull().default(0),
    reserved: integer().notNull().default(0),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    estimatedCost: real("estimated_cost").notNull().default(0),
    rateMinute: text("rate_minute"),
    rateCount: integer("rate_count").notNull().default(0),
  },
  (t) => [uniqueIndex("usage_user_month").on(t.userId, t.month)],
);
export const jobs = sqliteTable(
  "jobs",
  {
    id: text().primaryKey(),
    userId: uid(),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    kind: text().notNull(),
    status: text().notNull(),
    inputHash: text("input_hash").notNull(),
    goalVersion: integer("goal_version").notNull(),
    result: text(),
    error: text(),
    usageMonth: text("usage_month").notNull(),
    reserved: integer().notNull().default(1),
    createdAt: at(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("job_idempotency").on(t.userId, t.idempotencyKey),
    uniqueIndex("one_goal_job")
      .on(t.goalId)
      .where(sql`${t.status} IN ('running','committing')`),
  ],
);
export const aiCalls = sqliteTable("ai_calls", {
  id: text().primaryKey(),
  userId: uid(),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  model: text().notNull(),
  promptVersion: text("prompt_version").notNull(),
  providerId: text("provider_id"),
  latencyMs: integer("latency_ms").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  cost: real(),
  status: text().notNull(),
  error: text(),
  createdAt: at(),
});
export const webhookEvents = sqliteTable("webhook_events", {
  id: text().primaryKey(),
  type: text().notNull(),
  createdAt: at(),
});
export const audit = sqliteTable("audit", {
  id: text().primaryKey(),
  actorId: text("actor_id").notNull(),
  action: text().notNull(),
  target: text().notNull(),
  details: text().notNull(),
  createdAt: at(),
});
export const templates = sqliteTable("templates", {
  id: text().primaryKey(),
  kind: text().notNull(),
  title: text().notNull(),
  content: text().notNull(),
  version: integer().notNull().default(1),
  enabled: integer().notNull().default(1),
  createdAt: at(),
});
export const feedback = sqliteTable("feedback", {
  id: text().primaryKey(),
  userId: uid(),
  content: text().notNull(),
  status: text().notNull().default("open"),
  createdAt: at(),
});
export const externalFeedback = sqliteTable("external_feedback", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  reviewer: text().notNull(),
  role: text().notNull(),
  context: text().notNull(),
  feedback: text().notNull(),
  evidenceUrl: text("evidence_url"),
  verifiedIdentity: integer("verified_identity").notNull().default(0),
  createdAt: at(),
});
export const projects = sqliteTable("projects", {
  id: text().primaryKey(),
  userId: uid(),
  goalId: text("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text().notNull(),
  outcome: text().notNull(),
  status: text().notNull().default("active"),
  version: integer().notNull().default(1),
  createdAt: at(),
});
