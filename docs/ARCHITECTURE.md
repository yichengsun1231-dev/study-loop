# Architecture

Empty existing GitHub repository inspected before implementation. Cloud runtime: Node 24, no prior framework. The Sites skill's normal starter/helper files are not installed in this executor. Use maintainable TypeScript with React/Vite, Hono and a Cloudflare Worker, respecting Sites' Worker module deployment contract. D1 owns relational state, R2 owns private uploads, Sites dispatch owns authentication. No bespoke password system or client-side entitlement authority.

React → same-origin Hono APIs → authenticated user authorization → D1/R2. Workflow-specific Zod schemas → OpenAI Responses API → backend business validation → atomic D1 batch. React Flow + Dagre provide interactive dependency maps. OpenAI/Stripe official SDKs isolate changing external interfaces. Model/provider keys stay in Worker secrets.

Mutating APIs enforce same-origin requests, bounded bodies, owned resource lookups and optimistic versions. All SQL is parameterized. No automatic webpage fetching or learner-code execution. Uploaded text is bounded, delimited untrusted context; file/link preview is non-executable. File downloads use Content-Disposition attachment and nosniff.

Learning states: discover → map → assign → teach → monitor → adapt → verify → assign. Workflow preconditions, confirmed goals, immutable task versions, required rubric evidence and independent-attempt rules constrain model proposals. Prior skills/evidence survive path revisions. A model cannot create independent verification by assertion.

AI calls use durable jobs scoped by (user, idempotency key), one in-flight job per goal, atomic monthly quota reservation, bounded time, SDK transient retry, disconnect cancellation and explicit job recovery. SSE exposes status and incremental model generation; only schema/business-validated final records are committed. Workflow jobs and final learning writes complete together. Failed requests release reservations, retain drafts and record sanitized failure metadata. The maintenance endpoint reconciles stale jobs; an external scheduled trigger is required for unattended cleanup. Provider tokens/cost are recorded separately from successful-call quota.

Stripe uses raw-body signature validation and retrieves canonical subscription state. Customer/user mapping is server-created. Entitlements check active/trialing status and period end; checkout redirect is not proof of payment. Test mode is default; live mode requires explicit environment configuration. Webhook event IDs are unique. Admin requires ADMIN_USER_IDS; no first visitor gains admin.

Deployment: private Sites Worker with provisioned D1/R2; GitHub is source of truth for product code. Local Wrangler state is separate. SQL migrations are generated and versioned, never executed as runtime DDL. Production data is excluded from Git and release archives.
