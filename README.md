# Kleos

**Build the skills to answer it yourself.**

An English personal-learning workspace that connects a chosen direction to projects, skill dependencies, concrete tasks, work versions, specific feedback and independently supported capability. The first release prioritizes the learning loop and three explicitly labelled interactive demo scenarios. IDE integration and commercial launch are deferred.

## Start locally

Node 22.13+ (developed with Node 24).

```sh
npm ci
cp .env.example .dev.vars
# For a localhost-only preview without Sites dispatch:
# set DEV_AUTH=true in .dev.vars. Never configure this on a hosted deployment.
npm run db:migrate
npm run dev
```

On managed Codex Cloud, use `sites-preview start /workspace/study-loop` instead of starting a second server. The development launcher keeps disposable Cloudflare config/log state inside the checkout. If your host's npm cache is not writable, select a writable npm_config_cache for installation.

## Three demos

Open **Challenges → Try a complete learning scenario**:

1. **Python project**: goal → dependency map → expense-summary code → reasoning → specific example feedback → portfolio.
2. **Career exploration / coffee chat**: public research → prepared questions → voluntary notes → facts vs inference → next practice and fallback activity.
3. **Cooking practice**: deliberate practice → process record → taster feedback → qualified review boundaries.

These create separate, clearly labelled demo goals. Sample submissions and scripted feedback are not live AI calls, not learner skill evidence, and do not increase genuine submission/verified-skill metrics. Model responses are never simulated on the real AI endpoint.

For your own learning: create a goal via **Explore a direction / Build a project / Learn a skill**, confirm an outcome and success criteria, choose a curated starter or edit your own DAG, create a task, save/submit work, reflect, add real-world feedback, and keep a project version in your portfolio.

## Connect the real Agent

Set `OPENAI_API_KEY` server-side in `.dev.vars` for local development, or in the Site's production runtime settings; redeploy production after a secret change. Default model: `gpt-4.1-mini`, configurable with `OPENAI_MODEL`. Never place a secret in browser code or chat. In the managed Sites workflow, use the OpenAI Developers plugin's API-key provisioning skill when available.

The server has separate validated discover/map/diagnose/assign/hint/evaluate/adapt/verify/design workflows, current-goal context retrieval, four hint levels, SSE, cancellation, durable idempotent jobs, quota reservations, failure recovery and evidence rules. No model credential was supplied during this build. Without one, the API explicitly returns AI_NOT_CONFIGURED and preserves work. Live model quality/cost and full real-provider end-to-end acceptance remain pending; model test doubles exist only in tests.

## Validate and build

```sh
npm test
npm run typecheck
npm run build
```

Drizzle schema: `worker/schema.ts`. Generated, immutable migrations: `drizzle/`. No request-time DDL. `npm run db:generate` appends a schema migration. Local data stays in ignored `.wrangler/`; production uses separate provisioned D1/R2 bindings.

Build produces a Cloudflare Worker at `dist/server/index.js`, client assets in `dist/client`, and deployment metadata under `dist/.openai`. The Site remains private by default. GitHub stores source, not production learning data, user uploads, secrets or runtime state.

See [requirements](docs/REQUIREMENTS.md), [architecture](docs/ARCHITECTURE.md), [API/workflows](docs/API.md), [scope and limits](docs/STATUS.md), [operations](docs/OPERATIONS.md), and [GitHub research](docs/OPEN_SOURCE.md).
