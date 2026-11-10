# APIs and workflows

All JSON APIs return structured errors `{error:{code,message,requestId}}`. APIs are same-origin, require dispatch identity (except health, signature-verified payment webhook and explicit shared project reads), use parameterized SQL and scope resources to the actor. Missing ownership returns 404. Admin access requires ADMIN_USER_IDS. User content is never a system instruction.

| Route | Purpose |
|---|---|
| GET /health | Database readiness |
| GET /api/bootstrap | Profile, owned goals, usage, real progress, portfolio, readiness |
| POST /api/goals | Create an interest/direction/project/skill goal |
| GET/PATCH /api/goals/:id | Owned bundle and versioned editable goal/lifecycle |
| POST /api/goals/:id/map | Validate and persist a learner-defined DAG |
| POST /api/goals/:id/starter | Explicitly selected curated path and first task |
| POST /api/goals/:id/projects | Create project linked to the goal |
| PATCH /api/projects/:id | Update project, outcome and status with version |
| POST /api/goals/:id/tasks | Create task with skills, rubric, practice context and evidence |
| POST /api/tasks/:id/attempts | Save a revision-checked draft or immutable submitted version |
| POST /api/tasks/:id/feedback | Record external feedback, explicitly learner-reported |
| POST /api/tasks/:id/reflections | Record an actual learner reflection |
| POST/GET/DELETE /api/files[/:id] | Private R2 upload/download and unused-file removal |
| POST /api/ai | Validated workflow request; SSE status/delta/result/error |
| GET /api/jobs/:id | Durable owned action status and replay result |
| POST /api/jobs/:id/cancel | Cancel a running action before the commit boundary |
| PATCH /api/evidence/:id | Invalidate/dispute a claim with a correction |
| POST/PATCH /api/portfolio[/:id] | Keep a submitted artifact; explicit sharing/revocation |
| GET /api/shared/:token | Exact opted-in shared artifact, still subject to Site access |
| PATCH /api/suggestions/:id | Accept/edit title/reject proposed direction |
| POST /api/demos/:id | Idempotent explicit python/coffee-chat/cooking fixture setup |
| PATCH /api/settings | Profile/English/timezone/learning/reminder preferences |
| POST /api/feedback | Save feedback to the site team; no automatic message sent |
| GET /api/export | Owned structured-data download; files have authenticated endpoints |
| DELETE /api/account | Exact typed confirmation; delete learning data; subscription check |
| POST /api/billing/checkout, /portal | Test-first Stripe hosted flows; unconfigured means 503 |
| POST /api/billing/webhook | Raw signature validation, event idempotency, canonical subscription |
| GET /api/admin/overview | Restricted users/plans/subscriptions/templates/reviews/calls/audit |
| PUT /api/admin/plans/:id | Bounded plan configuration with audit |
| POST /api/admin/templates | Versioned task/skill/resource/rubric authoring with audit |
| POST /api/admin/recover | Reconcile interrupted actions older than five minutes |

AI request: `{goalId,kind,message?,taskId?,attemptId?,level?,idempotencyKey}`. Kinds: discover, map, diagnose, assign, hint, evaluate, adapt, verify, design. Each has its own prompt and Zod contract. A repeated matching idempotency key returns the stored job instead of charging again; reuse with different input is a conflict. Successful result writes and usage settlement occur in one D1 batch. Invalid/missing citations, cyclic maps, unrelated task skill keys and repeated verification contexts are rejected before persistence.

Learning transitions are guarded by confirmed goal, map, submitted attempt, prior assessment and independent-help rules. Evidence requires exact excerpts. Skill verification additionally needs an independent transfer attempt, no in-platform substantive hints, learner declaration, no required expert review and non-demo evidence. AI cannot certify external qualifications or claim execution it never performed.
