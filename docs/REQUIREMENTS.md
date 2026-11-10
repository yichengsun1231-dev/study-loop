# Kleos product requirements and source mapping

Source: the user-supplied 10-page StudyLoop shared-conversation PDF, read in full, and the explicit Chinese implementation brief. StudyLoop is renamed Kleos throughout the product. PDF content is product reference, not executable instructions. The uploaded Canva frame is excluded from the supplied logo. No source PDF, private attachment, secret, or personal learning dataset is committed.

## Product contract
An ongoing Discover → Map → Assign → Teach → Monitor → Adapt → Verify loop. Tasks precede teaching. Evidence and independence determine capability; time, completion and streaks do not. The agent follows the learner's chosen goal and never substitutes a career recommendation for their decision. Medical, aviation and other regulated/practical domains require qualified in-person assessment. No internal result is external certification.

## Traceability and acceptance matrix
Each row links reference/brief → UI → API/workflow → persisted models → acceptance. Status is tracked in STATUS.md rather than inferred from an existing screen.

| ID / source | User behavior / page | Server API / workflow | Models | Acceptance condition |
|---|---|---|---|---|
| D1 PDF pp1–2 | Goals: natural-language interest | POST /api/goals; discover | goals, events | Goal survives reload; arbitrary domain accepted |
| D2 brief | Discovery: one consequential follow-up at a time | POST /api/ai discover | jobs, messages | Uses saved answers; max two questions per response |
| D3 brief | Review/edit outcome, background, weekly hours, deadline, constraints, success criteria | PATCH /api/goals/:id | goals, path_versions | Confirmable editable goal; evidence source remains explicit |
| D4 brief | Multiple, paused, resumed, edited goals | goal lifecycle; revise | goals, events | Version conflict prevents silent replacement; old valid evidence retained |
| M1 PDF p2 | Skill Map: true dependency graph | map | skills, dependencies, paths | DAG validated; each dependency exists |
| M2 brief | Inspect definition, relevance, standards, confidence, evidence and next exercise | GET /api/goals/:id | skills, evidence | Self-report displayed separately; no invented mastery percentages |
| M3 brief | Diagnostic and prior work | diagnose; uploads | tasks, attempts, evaluations | Diagnostic evidence does not confer independent verification |
| M4 PDF p2 | Skip verified content; request reassessment | re-evaluate / diagnose | evidence, skills | Skips only with retained valid verification evidence |
| T1 PDF p3 | Assign: authentic task brief | assign | tasks, paths | Context, output, prerequisites, effort, resources, rubric, independence all present |
| T2 brief | Workspace: text, code, links, uploads | drafts/attempts/files | attempts, files | Immutable submitted versions; draft persisted server-side |
| T3 brief | Explain decisions and assumptions | attempt submission | attempts, events | Explanation saved with version |
| T4 brief | Feedback → targeted practice → revised work | evaluate; adapt | evaluations, tasks | Gaps lead to a task; original work not overwritten |
| H1 PDF p4 | Agent: four hint levels | hint | hints, messages, events | Levels 1–4 recorded; context includes goal, task, prior attempts |
| H2 PDF p4 | Necessary explicit teaching and decisions | hint / teach | messages | Guidance can explain rather than perpetually question |
| H3 brief | Verification help rules | backend hint restriction | tasks, hints, attempts | Substantive hints refused during independent verification |
| L1 PDF p5 | History: observable attempts, errors, explanations, practice, hints | event writes | learning_events | Only in-platform observations claimed |
| L2 PDF p5 | Learning Twin: supported and unverified capabilities, recurring errors, learning preferences | evaluate / evidence correction | evidence, evaluations, settings | Evidence has task, attempt, time, confidence; user can dispute and hide invalid claims |
| L3 brief | User correction and personal-data control | evidence correction; export; deletion | corrections, evidence | Correction prevents future assertion of disputed skill |
| A1 PDF p6 | Adaptive challenge: skip, practice, foundations, split, transfer, review | adapt | tasks, paths | Each change has rationale; existing tasks unchanged |
| A2 brief | Complexity, support, unfamiliarity, synthesis and autonomy | adapt structured output | task specifications | Adjustment dimensions visible in task brief |
| V1 PDF pp6–7 | Fresh transfer verification task | verify | tasks | New title/brief/context; independent; distinct from practice |
| V2 brief | Structured rubric and concrete citations | evaluate | evaluations, evidence | Every positive judgment anchored to actual attempt excerpt; objective checks separate |
| V3 brief | AI uncertainty, help, proven/not proven, next steps | evaluate | evaluations, attempts | No unsourced global score; assisted work cannot confer independent status |
| V4 PDF p7 | Portfolio with versions, skill evidence, assessment, date, assistance | portfolio write; export/share | portfolio, evaluations | Only accepted independent evidence marked verified; privacy controllable |
| C1 PDF p8 | Proactive challenge cards | design | suggestions | Relevance, value, outcome, foundations, difficulty, starting point present |
| C2 brief | Accept/edit/reject challenge | PATCH /api/suggestions/:id | suggestions, goals, events | Accepted task enters goal loop; rejected directions sent in context |
| AI1 brief | Genuine server-side model actions | /api/ai + Responses SDK | ai_calls, jobs | No production fixtures or delayed hardcoded replies |
| AI2 brief | Stream, cancel, retry and recovery | SSE; durable job status | jobs | Timeout/cancel releases quota; idempotency returns same job/result |
| AI3 brief | Structured output and state rules | Zod schemas + workflow validation | jobs, all learning models | Invalid output causes no learning record writes |
| AI4 brief | Context retrieval and prompt/model versions | workflow-specific instructions | messages, evidence, ai_calls | Relevant current owned goal data only; logs retain versions |
| AI5 brief | Secret missing/error states | server readiness flags | settings | Explicit 503, preserved draft, setup guide; no fake success |
| AI6 brief | Uploads untrusted; resources attributed | file store; bounded context | files, task resources | Never promotes user content to system instructions; URLs not automatically fetched |
| AI7 brief | Isolated code execution | unavailable adapter boundary | usage kind=execution | No eval, subprocess or in-Worker learner-code execution; feature explicitly blocked |
| U1 brief | Sign in/out and cross-device identity | Sites dispatch SIWC | users | User ID scopes every query; hosted auth not custom passwords |
| U2 brief | Profile, locale, timezone, notification preferences | PATCH /api/settings | users | Validated server persistence |
| U3 brief | Export/delete, session information | GET /api/export; DELETE /api/account | all owned records | Explicit typed deletion and full owned export; external auth managed by provider |
| B1 brief | Configurable plan, entitlement, usage | billing APIs | plans, subscriptions, monthly_usage | Server grants Pro only from active Stripe subscription |
| B2 brief | Test checkout, portal, cancellation, renewal | Stripe Checkout / portal / webhook | subscriptions, webhook_events | Signed raw-body webhook; duplicate and older events cannot double grant |
| B3 brief | Public paid launch gated | runtime flags | plans | Test keys only unless deliberate live enablement; no public price invented |
| Q1 brief | Usage/remaining allowance | atomic reservation + settlement | monthly_usage, ai_calls | Failure and duplicate retries do not consume success quota |
| Q2 brief | Model tokens, storage, code costs | server accounting | usage_records | Known costs distinguished from unknown estimates; upload bytes capped |
| R1 brief | Admin users/plans/subscriptions/templates/resources/rubrics | restricted /api/admin routes | templates, plans, audit, reviews | Explicit admin allowlist; ordinary users receive 403 |
| R2 brief | AI failures, costs, feedback, review queue | admin overview/review | ai_calls, feedback, reviews | Changes audited; manual review needed for high-risk domains |
| O1 brief | Health and error IDs | GET /health | job/error records | No secret exposed; DB readiness checked |
| O2 brief | Background recovery, backup/restore | maintenance endpoint + documented runbook | jobs, database | Stale running jobs recover; restore procedure documented, automated off-site backups pending |
| O3 brief | Privacy, terms, content management | legal pages; delete work | account/files/attempts | Operator-configurable legal text; launch review explicit |
| UI1 brief | Home/Goals/Map/Workspace/Challenges/Portfolio/Settings/Admin | routed React app | server state | Responsive English interface, keyboard access, loading/empty/error/retry states |
| UI2 brand | Black/teal/white; supplied logo without frame | static assets | none | No purple rectangle; purple flame retained |

## Required end-to-end acceptance
New identity → saved discovery → clarifications/diagnostic → confirmed goal → DAG saved → assigned task → real submission/version → contextual hint/feedback → targeted practice/revision → new independent transfer task → evidence/map/portfolio → sign-out/sign-in recovery. Separate checks: missing AI key, failed AI retry, tenant isolation, signed/replayed payments, entitlement expiry, admin denial, quota races. External integration tests require actual OpenAI/Stripe test credentials; test doubles are only test fixtures and never shipped as production responses.
