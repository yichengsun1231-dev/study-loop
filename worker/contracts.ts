import { z } from "zod";
export const goalDetails = z.object({
  outcome: z.string().max(2000),
  background: z.string().max(3000),
  background_source: z.enum([
    "self_report",
    "prior_work",
    "diagnostic",
    "unknown",
  ]),
  weekly_hours: z.number().min(0).max(168),
  deadline: z.string().max(100),
  constraints: z.string().max(2000),
  success_criteria: z.array(z.string().max(500)).max(12),
  preference: z.enum(["practice", "theory", "both"]),
});
export const discoverySchema = z.object({
  reply: z.string(),
  questions: z.array(z.string()).max(2),
  details: goalDetails,
  ready_to_confirm: z.boolean(),
});
export const skillSpec = z.object({
  key: z.string().regex(/^[a-z0-9_-]{1,60}$/),
  name: z.string().min(1).max(120),
  definition: z.string().min(1).max(1500),
  relevance: z.string().min(1).max(1000),
  prerequisites: z.array(z.string()).max(15),
  standards: z.array(z.string().min(1)).min(1).max(8),
  basis: z.string().max(2000),
  next_practice: z.string().max(1500),
});
export const mapSchema = z.object({
  rationale: z.string().max(4000),
  skills: z.array(skillSpec).min(1).max(24),
});
export const taskSpec = z.object({
  preparation: z.string().max(3000),
  alternative_task: z.string().max(3000),
  collaboration_rules: z.string().max(2000),
  privacy_notes: z.string().max(2000),
  practice_location: z.enum([
    "platform",
    "home",
    "workplace",
    "professional_setting",
    "external_conversation",
    "team_challenge",
  ]),
  verification_method: z.enum(["ai_rubric", "objective", "mentor", "mixed"]),
  verification_boundary: z.string().max(2000),
  required_evidence: z.array(z.string().min(1).max(1000)).min(1).max(10),
  title: z.string().min(1).max(200),
  context: z.string().min(1).max(4000),
  deliverable: z.string().min(1).max(4000),
  skill_keys: z.array(z.string()).min(1).max(12),
  prerequisites: z.array(z.string()).max(12),
  difficulty: z.enum(["foundation", "developing", "stretch"]),
  estimated_minutes: z.number().int().min(5).max(2400),
  materials: z
    .array(z.object({ title: z.string(), url: z.string(), source: z.string() }))
    .max(12),
  criteria: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        description: z.string().min(1).max(1000),
        evidence_required: z.string().min(1).max(1000),
      }),
    )
    .min(1)
    .max(8),
  submission_kind: z.enum(["text", "code", "files", "link", "mixed"]),
  help_rules: z.string().max(1000),
  independence: z.enum(["guided", "independent"]),
  starting_point: z.string().max(2000),
  dimensions: z.object({
    complexity: z.string(),
    support: z.string(),
    unfamiliarity: z.string(),
    synthesis: z.string(),
    autonomy: z.string(),
  }),
});
export const assignSchema = z.object({
  rationale: z.string().max(4000),
  task: taskSpec,
});
export const adaptSchema = z.object({
  decision: z.enum([
    "advance",
    "practice",
    "foundation",
    "split",
    "transfer",
    "review",
  ]),
  rationale: z.string().max(4000),
  task: taskSpec,
});
export const hintSchema = z.object({
  answer: z.string().max(10000),
  decision_question: z.string().max(1500),
  sources: z
    .array(
      z.object({ title: z.string(), url: z.string(), uncertainty: z.string() }),
    )
    .max(8),
});
export const evaluationSchema = z.object({
  strengths: z
    .array(
      z.object({
        observation: z.string().max(1500),
        quote: z.string().min(1).max(3000),
        why_it_matters: z.string().max(1500),
      }),
    )
    .max(6),
  summary: z.string().max(4000),
  criteria: z
    .array(
      z.object({
        criterion_id: z.string(),
        status: z.enum(["met", "partial", "not_demonstrated"]),
        quote: z.string().max(3000),
        explanation: z.string().max(3000),
      }),
    )
    .min(1)
    .max(8),
  claims: z
    .array(
      z.object({
        skill_key: z.string(),
        claim: z.string().max(1000),
        quote: z.string().min(1).max(3000),
        confidence: z.enum(["low", "medium", "high"]),
      }),
    )
    .max(16),
  gaps: z.array(z.string()).max(12),
  misconceptions: z.array(z.string()).max(12),
  effective_teaching: z.array(z.string()).max(8),
  not_demonstrated: z.array(z.string()).max(12),
  uncertainty: z.string().max(3000),
  next_step: z.string().max(3000),
  requires_human_review: z.boolean(),
  domain_boundary: z.string().max(2000),
});
export const designerSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        why: z.string().max(2000),
        relevance: z.string().max(2000),
        outcome: z.string().max(2000),
        foundations: z.array(z.string()).max(10),
        difficulty: z.enum(["foundation", "developing", "stretch"]),
        skills: z.array(z.string()).max(10),
        starting_point: z.string().max(2000),
        estimated_minutes: z.number().int().min(5).max(2400),
      }),
    )
    .min(1)
    .max(4),
});
export const kinds = [
  "discover",
  "map",
  "diagnose",
  "assign",
  "hint",
  "evaluate",
  "adapt",
  "verify",
  "design",
] as const;
export type WorkflowKind = (typeof kinds)[number];
export const workflowRequest = z.object({
  goalId: z.string().uuid(),
  kind: z.enum(kinds),
  message: z.string().max(12000).default(""),
  taskId: z.string().uuid().optional(),
  attemptId: z.string().uuid().optional(),
  level: z.number().int().min(1).max(4).default(1),
  idempotencyKey: z.string().min(8).max(100),
});
export const workflowSchemas = {
  discover: discoverySchema,
  map: mapSchema,
  diagnose: assignSchema,
  assign: assignSchema,
  hint: hintSchema,
  evaluate: evaluationSchema,
  adapt: adaptSchema,
  verify: assignSchema,
  design: designerSchema,
};
export function validateGraph(map: z.infer<typeof mapSchema>) {
  const keys = new Set(map.skills.map((s) => s.key));
  if (keys.size !== map.skills.length)
    throw new Error("Skill keys must be unique.");
  const byKey = new Map(map.skills.map((s) => [s.key, s]));
  const visiting = new Set<string>(),
    done = new Set<string>();
  function visit(k: string) {
    if (visiting.has(k))
      throw new Error("Skill dependencies must not contain cycles.");
    if (done.has(k)) return;
    visiting.add(k);
    for (const dep of byKey.get(k)!.prerequisites) {
      if (!keys.has(dep)) throw new Error("Unknown prerequisite: " + dep);
      visit(dep);
    }
    visiting.delete(k);
    done.add(k);
  }
  for (const k of keys) visit(k);
}
export const defaultDetails = {
  outcome: "",
  background: "",
  background_source: "self_report" as const,
  weekly_hours: 3,
  deadline: "",
  constraints: "",
  success_criteria: [],
  preference: "practice" as const,
};
