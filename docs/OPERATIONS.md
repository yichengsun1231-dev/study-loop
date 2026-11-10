# Local, deployment and recovery runbook

Use Node 22.13+, `npm ci`, local `.dev.vars`, generated D1 migrations, then Vite. In managed Cloud, the supported `sites-preview` daemon owns the only preview. Never start another preview listener to bypass relay failures. Node development launcher puts writable Cloudflare config/log state in ignored project directories.

Hosted: Worker ESM entrypoint `dist/server/index.js`, D1 binding DB, private R2 BUCKET, assets `dist/client`. Identity is supplied by Sites dispatch. Never publish development identity, .dev.vars, .wrangler data or uploaded learning records. Keep the Site owner-private unless the user changes the audience.

Configuration: OPENAI_API_KEY/OPENAI_MODEL, optional current model token prices, explicit ADMIN_USER_IDS, SITE_URL. Stripe is test by default: STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, STRIPE_WEBHOOK_SECRET. Live keys require BILLING_MODE=live AND BILLING_LIVE_ENABLED=true, reviewed merchant/prices/legal settings, a real signed webhook route and full live-launch approval. The web UI never grants itself subscription privileges.

Deploy: run tests/typecheck/build; commit and push the exact source; archive built dist plus .openai/hosting.json; save and deploy that pushed SHA using Sites. Resource/migration configuration is tracked and production migration state is append-only. Native deployment status must reach succeeded before claiming a live URL.

Failures: inspect request ID, sanitized AI call error, job state and /health. Retry by new request after a failed job. For an uncertain completed request, read job or reuse its idempotency key. Recover running/committing jobs older than five minutes via authenticated restricted maintenance; ordinary bootstrap recovers only that user's stale jobs. An external scheduler is not configured in this release.

Backup before production migrations: export D1 with the provider's authenticated export tooling, and separately back up R2 objects plus owned metadata. Encrypt backups, restrict access and define operator retention. Restore into a NEW database/bucket, apply schema to a matching version, validate foreign keys, row counts, sampled files and tenant authorization, then deliberately switch bindings. Do not overwrite the only live copy. The user JSON export is portable learning data, not a complete infrastructure backup.

Account deletion blocks active subscriptions until managed, deletes the owner's objects/records and keeps an anonymous sign-in tombstone to prevent accidental recreation. Payment provider records have their own retention. A deployed public commercial operator must add actual privacy contacts, retention, support/refund terms and incident/backup responsibilities.
